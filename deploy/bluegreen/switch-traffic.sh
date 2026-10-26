#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

cd "${BG_ROOT:-/home/pi/financewebapp-bluegreen}"

mode="${1:---check}"
if [[ $# -gt 1 || ( "$mode" != "--check" && "$mode" != "--apply" ) ]]; then
  echo "Uso: $0 --check|--apply" >&2
  exit 2
fi

# Explicit activation gate: keep live switching disabled during installation.
if [[ "$mode" == "--apply" && ! -f state/switch-enabled ]]; then
  echo "BLOQUEADO: --apply exige autorizacao explicita (state/switch-enabled)." >&2
  exit 2
fi

# Este script e uma operacao interna da release.
# O bloqueio global e adquirido pelo release.sh.
if [[ "${BG_RELEASE_INTERNAL:-}" != "1" ]]; then
  echo "ERRO: executar atraves de release.sh." >&2
  exit 1
fi

active=$(<state/active-slot)
case "$active" in
  legacy-blue) next=green; old_api=8000; old_web=8080; new_api=8002; new_web=8082 ;;
  green)       next=blue;  old_api=8002; old_web=8082; new_api=8004; new_web=8084 ;;
  blue)        next=green; old_api=8004; old_web=8084; new_api=8002; new_web=8082 ;;
  *) echo "ERRO: slot ativo desconhecido: $active" >&2; exit 1 ;;
esac

proxy=financewebapp-switch-proxy-proxy-1
root=proxy/Caddyfile

[[ -f "$root" ]] || { echo "ERRO: Caddyfile ausente." >&2; exit 1; }
[[ ! -e state/switch-pending ]] || {
  echo "ERRO: existe uma troca anterior por reconciliar: state/switch-pending" >&2
  exit 1
}

# Fail closed if the recorded slot disagrees with the on-disk routing.
python3 - "$root" "$old_api" "$old_web" <<'PY'
from pathlib import Path
import sys
file, old_api, old_web = sys.argv[1:]
text = Path(file).read_text()
for port in (old_api, old_web):
    if text.count(f"reverse_proxy 127.0.0.1:{port}") != 1:
        raise SystemExit("ERRO: estado do slot nao corresponde ao proxy")
PY

# The slot must be running the precise version published on main.
sha="${DEPLOY_SHA:-}"
[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || { echo "ERRO: SHA de main invalido." >&2; exit 1; }
[[ "${BACKEND_SHA:-}" =~ ^[a-f0-9]{40}$ && "${FRONTEND_SHA:-}" =~ ^[a-f0-9]{40}$ ]] || {
  echo "ERRO: SHAs dos componentes invalidos." >&2
  exit 1
}
for svc in backend frontend; do
  if [[ "$svc" == backend ]]; then component_sha="$BACKEND_SHA"; else component_sha="$FRONTEND_SHA"; fi
  container="financewebapp-bg-${next}-slot_${svc}-1"
  expected="ghcr.io/hhaddenn/financewebapp-${svc}:${component_sha}"
  actual=$(docker inspect --format '{{.Config.Image}}' "$container") || exit 1
  [[ "$actual" == "$expected" ]] || {
    echo "ERRO: imagem ${svc} nao corresponde a main; preparar slot primeiro." >&2
    exit 1
  }
done

# Confirm the inactive slot before changing any proxy configuration.
curl -fsS --max-time 5 -H 'Host: financeapi.hugo-hadden.com' \
  -H 'X-Forwarded-Proto: https' "http://127.0.0.1:${new_api}/health/" >/dev/null
curl -fsS --max-time 5 -H 'Host: finance.hugo-hadden.com' \
  "http://127.0.0.1:${new_web}/" >/dev/null
docker exec "financewebapp-bg-${next}-slot_backend-1" \
  python /app/backend/manage.py migrate --check

version=$(docker exec "$proxy" caddy version)
[[ "$version" =~ ^v2\.(1[1-9]|[2-9][0-9])\. ]] || {
  echo "ERRO: Caddy sem suporte SIGUSR1 confirmado: $version" >&2
  exit 1
}

candidate=$(mktemp proxy/Caddyfile.next.XXXXXX)
backup=""
switched=false
committed=false

# If reload/probing fails, put the old configuration back and reload it.
cleanup() {
  rc=$?
  trap - EXIT
  if [[ "$switched" == true && "$committed" != true ]]; then
    echo "ERRO: switch nao confirmado; a tentar rollback do proxy." >&2
    restore=$(mktemp proxy/Caddyfile.restore.XXXXXX)
    if cp "$backup" "$restore" &&
		chmod 644 "$restore" &&
		mv -f "$restore" "$root" &&
		docker kill --signal=USR1 "$proxy" >/dev/null; then
		echo "Rollback do proxy solicitado ao Caddy." >&2
	else
		echo "ALERTA CRITICO: falha ao restaurar o proxy." >&2
	fi

	# Manter switch-pending para o release.sh reconciliar.
	# Nao assumir sucesso apenas porque o sinal foi enviado.
  fi
  rm -f "$candidate"
  exit "$rc"
}
trap cleanup EXIT

python3 - "$root" "$old_web" "$old_api" "$new_web" "$new_api" "$next" "$candidate" <<'PY'
from pathlib import Path
import sys
filename, old_web, old_api, new_web, new_api, next_slot, dest = sys.argv[1:]
text = Path(filename).read_text()
lines = [line for line in text.splitlines()
         if not line.strip().startswith('header X-BlueGreen-Slot ')]
text = '\n'.join(lines) + '\n'
for old, new in ((old_web, new_web), (old_api, new_api)):
    needle = f'reverse_proxy 127.0.0.1:{old}'
    if text.count(needle) != 1:
        raise SystemExit('ERRO: proxy alterado; switch bloqueado')
    text = text.replace(needle,
        f'header X-BlueGreen-Slot {next_slot}\n    '
        f'reverse_proxy 127.0.0.1:{new}', 1)
Path(dest).write_text(text)
PY
chmod 644 "$candidate"
docker exec "$proxy" caddy validate \
  --config "/etc/caddy/$(basename "$candidate")" \
  --adapter caddyfile >/dev/null

echo "Slot atual: $active"
echo "Slot preparado: $next"
echo "Release confirmada: $sha; backend: $BACKEND_SHA; frontend: $FRONTEND_SHA"
echo "Configuracao do proxy: valida"
if [[ "$mode" == "--check" ]]; then
  echo "DRY RUN: trafego nao alterado."
  exit 0
fi

# Journal the operation before replacing the configuration.
backup="backups/Caddyfile-before-$(date -u +%Y%m%dT%H%M%SZ)"
cp -p "$root" "$backup"
printf '%s\n' "${active} -> ${next}; ${sha}; ${backup}" > state/switch-pending
mv -f "$candidate" "$root"
switched=true
docker kill --signal=USR1 "$proxy" >/dev/null

# A successful HTTP response alone is not enough: verify the new slot header.
ready=false
for _ in {1..12}; do
  front=$(curl -fsS --max-time 3 -D - -o /dev/null \
    -H 'Host: finance.hugo-hadden.com' \
    http://127.0.0.1:9080/ 2>/dev/null) || front=""
  api=$(curl -fsS --max-time 3 -D - -o /dev/null \
    -H 'Host: financeapi.hugo-hadden.com' \
    -H 'X-Forwarded-Proto: https' \
    http://127.0.0.1:9000/health/ 2>/dev/null) || api=""
  if grep -qiE "^X-BlueGreen-Slot: ${next}[[:space:]]*$" <<< "$front" && \
     grep -qiE "^X-BlueGreen-Slot: ${next}[[:space:]]*$" <<< "$api"; then
    ready=true
    break
  fi
  sleep 1
done
if [[ "$ready" != true ]]; then
  echo "ERRO: proxy nao confirmou o novo slot." >&2
  exit 1
fi

printf '%s\n' "$next" > state/active-slot.next
mv -f state/active-slot.next state/active-slot
committed=true
rm -f state/switch-pending
echo "SUCESSO: proxy alterado para $next."
