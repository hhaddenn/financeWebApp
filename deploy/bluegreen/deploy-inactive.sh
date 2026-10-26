#!/usr/bin/env bash
set -euo pipefail
umask 077

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

cd "${BG_ROOT:-/home/pi/financewebapp-bluegreen}"

# Este script e uma operacao interna da release.
# O bloqueio global e adquirido pelo release.sh.
if [[ "${BG_RELEASE_INTERNAL:-}" != "1" ]]; then
  echo "ERRO: executar atraves de release.sh." >&2
  exit 1
fi

active=$(cat state/active-slot)

case "$active" in
    legacy-blue)
        slot=green
        api_port=8002
        web_port=8082
        old_api=8000
        old_web=8080
        ;;
    green)
        slot=blue
        api_port=8004
        web_port=8084
        old_api=8002
        old_web=8082
        ;;
    blue)
        slot=green
        api_port=8002
        web_port=8082
        old_api=8004
        old_web=8084
        ;;
    *)
        echo "ERRO: slot ativo desconhecido."
        exit 1
        ;;
esac

# Impedir operacoes se o estado nao corresponder ao Caddyfile.
grep -Fq "reverse_proxy 127.0.0.1:$old_api" proxy/Caddyfile
grep -Fq "reverse_proxy 127.0.0.1:$old_web" proxy/Caddyfile

# Identificar o commit publicado na branch main.
sha="${DEPLOY_SHA:-}"

if [[ ! "$sha" =~ ^[0-9a-f]{40}$ ]]; then
    echo "ERRO: SHA de main invalido."
    exit 1
fi

echo "Slot ativo: $active"
echo "A preparar: $slot"
echo "Commit: $sha"

export DEPLOY_SHA="$sha"
export BG_API_PORT="$api_port"
export BG_WEB_PORT="$web_port"

compose=(
    docker compose
    -f "$script_dir/docker-compose.slot.yml"
    -p "financewebapp-bg-$slot"
)

# Descarregar as duas imagens antes de recriar contentores.
"${compose[@]}" pull slot_backend slot_frontend

# Recriar exclusivamente o slot inativo.
"${compose[@]}" up -d --no-deps --no-build \
    slot_backend slot_frontend

# Verificar os servicos durante um maximo de 60 segundos.
ready=false

for _ in {1..30}; do
    if curl -fsS --max-time 3 \
        -H 'Host: financeapi.hugo-hadden.com' \
        -H 'X-Forwarded-Proto: https' \
        "http://127.0.0.1:$api_port/health/" \
        >/dev/null 2>&1 &&
       curl -fsS --max-time 3 \
        -H 'Host: finance.hugo-hadden.com' \
        "http://127.0.0.1:$web_port/" \
        >/dev/null 2>&1; then
        ready=true
        break
    fi
    sleep 2
done

if [[ "$ready" != true ]]; then
    echo "ERRO: novo slot nao esta saudavel."
    exit 1
fi

# Bloquear a troca caso existam migrations por aplicar.
"${compose[@]}" exec -T slot_backend \
    python /app/backend/manage.py migrate --check

echo "Slot $slot preparado e validado."
echo "Trafego nao alterado."
