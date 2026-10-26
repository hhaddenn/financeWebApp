#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

mode="${1:-}"

if [[ $# != 1 || ( "$mode" != --check && "$mode" != --apply ) ]]; then
  echo 'Uso: release.sh --check|--apply' >&2
  exit 2
fi

src="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
root="${BG_ROOT:-/home/pi/financewebapp-bluegreen}"
cd "$root"

# Bloquear toda a operacao: preparacao, switch e Celery.
exec 7>state/deploy.lock
flock -n 7 || {
  echo 'ERRO: existe outro deployment em curso.' >&2
  exit 1
}

exec 8>state/release.lock
flock -n 8 || {
  echo 'ERRO: outra release em curso.' >&2
  exit 1
}

for marker in state/release-pending state/switch-pending state/switch-enabled; do
  [[ ! -e "$marker" ]] || {
	echo "ERRO: reconciliar $marker primeiro." >&2
	exit 1
  }
done

initial=$(<state/active-slot)

case "$initial" in
  legacy-blue)
	next=green
	old_worker=financewebapp-celery-1
	old_endpoint=/api/auth/csrf/
	;;
  green)
	next=blue
	old_worker=financewebapp-live-worker-worker-1
	old_endpoint=/health/
	;;
  blue)
	next=green
	old_worker=financewebapp-live-worker-worker-1
	old_endpoint=/health/
	;;
  *)
	echo "ERRO: slot desconhecido: $initial" >&2
	exit 1
	;;
esac

[[ "$(docker inspect -f '{{.State.Running}}' "$old_worker")" == true ]] || {
  echo 'ERRO: Celery de producao nao esta em execucao.' >&2
  exit 1
}

sha=$(git ls-remote \
  https://github.com/hhaddenn/financeWebApp.git \
  refs/heads/main | awk '{print $1}')

[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || {
  echo 'ERRO: SHA invalido.' >&2
  exit 1
}

# Resolve each image from the last relevant change in main, without rebuilding
# unaffected components and without relying on the mutable latest tag.
resolved=$(bash "$src/resolve-images.sh" "$sha")
BACKEND_SHA=$(printf '%s\n' "$resolved" | sed -n 's/^BACKEND_SHA=//p')
FRONTEND_SHA=$(printf '%s\n' "$resolved" | sed -n 's/^FRONTEND_SHA=//p')
[[ "$BACKEND_SHA" =~ ^[a-f0-9]{40}$ && "$FRONTEND_SHA" =~ ^[a-f0-9]{40}$ ]] || {
  echo 'ERRO: resolucao das imagens devolveu SHAs invalidos.' >&2
  exit 1
}
export DEPLOY_SHA="$sha" BACKEND_SHA FRONTEND_SHA


# Bloquear operacoes de producao antes de qualquer alteracao.
if [[ "$mode" == --apply && "${BG_ENABLE_SWITCH:-}" != YES ]]; then
  echo 'BLOQUEADO: --apply exige BG_ENABLE_SWITCH=YES.' >&2
  exit 2
fi

check_old_proxy() {
  local front api

  front=$(curl -fsS --max-time 5 -D - -o /dev/null \
	-H 'Host: finance.hugo-hadden.com' \
	http://127.0.0.1:9080/)

  api=$(curl -fsS --max-time 5 -D - -o /dev/null \
	-H 'Host: financeapi.hugo-hadden.com' \
	-H 'X-Forwarded-Proto: https' \
	"http://127.0.0.1:9000$old_endpoint")

  if [[ "$initial" == legacy-blue ]]; then
	local status

	status=$(curl -sS --max-time 5 -o /dev/null \
	  -w '%{http_code}' \
	  -H 'Host: financeapi.hugo-hadden.com' \
	  http://127.0.0.1:9000/health/)

	[[ "$status" == 404 ]]
  else
	grep -qiE "^X-BlueGreen-Slot: ${initial}[[:space:]]*$" \
	  <<< "$front" || return 1

	grep -qiE "^X-BlueGreen-Slot: ${initial}[[:space:]]*$" \
	  <<< "$api" || return 1
  fi
}

check_old_proxy || {
  echo 'ERRO: proxy nao corresponde ao slot ativo.' >&2
  exit 1
}

# O modo check apenas valida os pre-requisitos existentes.
# Nao descarrega imagens nem recria contentores.
if [[ "$mode" == --check ]]; then
  echo "PRECHECK OK: slot atual=$initial; release candidata=$sha; backend=$BACKEND_SHA; frontend=$FRONTEND_SHA"
  echo 'Nenhum contentor ou rota de trafego foi alterado.'
  exit 0
fi

# Em apply, preparar e validar o slot inativo.
export BG_RELEASE_INTERNAL=1
bash "$src/deploy-inactive.sh"
bash "$src/switch-traffic.sh" --check

worker=(
  docker compose
  -f "$src/docker-compose.worker.yml"
  -p financewebapp-live-worker
)

"${worker[@]}" config --quiet

old_sha=""

if [[ "$initial" != legacy-blue ]]; then
  current_image=$(docker inspect \
	-f '{{.Config.Image}}' \
	"financewebapp-bg-${initial}-slot_backend-1")

  worker_image=$(docker inspect \
	-f '{{.Config.Image}}' "$old_worker")

  [[ "$worker_image" == "$current_image" ]] || {
	echo 'ERRO: backend e Celery usam versoes diferentes.' >&2
	exit 1
  }

  old_sha="${worker_image##*:}"

  # Garantir que a imagem antiga continua disponivel para rollback.
  docker image inspect "$worker_image" >/dev/null || {
	echo 'ERRO: imagem anterior indisponivel para rollback.' >&2
	exit 1
  }

  active_frontend_image=$(docker inspect -f '{{.Config.Image}}' \
    "financewebapp-bg-${initial}-slot_frontend-1")

  if [[ "$current_image" == "ghcr.io/hhaddenn/financewebapp-backend:$BACKEND_SHA" &&
        "$active_frontend_image" == "ghcr.io/hhaddenn/financewebapp-frontend:$FRONTEND_SHA" ]]; then
	echo 'A versao de main ja esta em producao.'
	exit 0
  fi
fi

echo "Release preparada: $initial -> $next ($sha)"

proxy=financewebapp-switch-proxy-proxy-1

backup=$(mktemp backups/Caddyfile.release.XXXXXX)
cp -p proxy/Caddyfile "$backup"

printf 'old=%s new=%s old_sha=%s new_sha=%s backend_sha=%s frontend_sha=%s backup=%s\n' \
  "$initial" "$next" "$old_sha" "$sha" "$BACKEND_SHA" "$FRONTEND_SHA" "$backup" \
  > state/release-pending

stop_attempted=false
switch_attempted=false
release_ok=false

restore_proxy() {
  local restored

  restored=$(mktemp proxy/Caddyfile.restore.XXXXXX)

  cp -p "$backup" "$restored" &&
	chmod 644 "$restored" &&
	mv -f "$restored" proxy/Caddyfile || return 1

  docker kill --signal=USR1 "$proxy" >/dev/null || return 1

  for _ in {1..15}; do
	if check_old_proxy; then
	  printf '%s\n' "$initial" > state/active-slot.next
	  mv -f state/active-slot.next state/active-slot

	  rm -f state/switch-pending
	  return 0
	fi

	sleep 1
  done

  return 1
}


# Verificar se o Celery responde, nao apenas se o Docker esta ativo.
check_worker() {
  local container="$1"
  local node

  [[ "$(docker inspect -f '{{.State.Running}}' \
    "$container" 2>/dev/null)" == true ]] || return 1

  node=$(docker inspect -f '{{.Config.Hostname}}' "$container") ||
    return 1

  docker exec "$container" \
    celery -A backend inspect ping \
      --destination="celery@$node" \
      --timeout=3 --json 2>/dev/null |
    python3 -c '
import json
import sys

try:
    data = json.load(sys.stdin)
    assert any(
        isinstance(value, dict) and value.get("ok") == "pong"
        for value in data.values()
    )
except (ValueError, AssertionError, AttributeError):
    sys.exit(1)
' >/dev/null
}

wait_for_worker() {
  local container="$1"

  for _ in {1..15}; do
    if check_worker "$container"; then
      return 0
    fi
    sleep 2
  done

  return 1
}

restore_worker() {
  local new_worker=financewebapp-live-worker-worker-1
  local running

  if [[ "$initial" == legacy-blue ]]; then
    running=$(docker inspect -f '{{.State.Running}}' \
      "$new_worker" 2>/dev/null || true)

    if [[ "$running" == true ]]; then
      docker stop --time -1 "$new_worker" >/dev/null ||
        return 1
    fi

    running=$(docker inspect -f '{{.State.Running}}' \
      "$old_worker" 2>/dev/null || true)

    if [[ "$running" != true ]]; then
      docker start "$old_worker" >/dev/null || return 1
    fi
  else
    # O worker novo reutiliza o mesmo nome Docker.
    # Recria-lo com o SHA anterior.
    running=$(docker inspect -f '{{.State.Running}}' \
      "$old_worker" 2>/dev/null || true)

    if [[ "$running" == true ]]; then
      docker stop --time -1 "$old_worker" >/dev/null ||
        return 1
    fi

    [[ "$old_sha" =~ ^[a-f0-9]{40}$ ]] || {
		echo 'ERRO: SHA da versao anterior invalido.' >&2
		return 1
	}

	BACKEND_SHA="$old_sha" "${worker[@]}" up -d \
		--no-build --force-recreate worker >/dev/null ||
		return 1
  fi

  wait_for_worker "$old_worker"
}

finish() {
  local rc=$?
  local recovered=true
  local current

  trap - EXIT INT TERM
  rm -f state/switch-enabled

  if [[ "$release_ok" == true ]]; then
    rm -f state/release-pending
    exit 0
  fi

  echo 'FALHA: a recuperar a release anterior.' >&2

  # Recuperar o proxy, se a troca chegou a ser tentada.
  if [[ "$switch_attempted" == true ]]; then
    current=$(cat state/active-slot 2>/dev/null || true)

    if [[ "$current" != "$initial" ]] ||
       ! check_old_proxy; then
      restore_proxy || recovered=false
    fi
  fi

  # Recuperar o worker depois de confirmar o encaminhamento.
  if [[ "$stop_attempted" == true ]]; then
    restore_worker || recovered=false
  fi

  # Confirmar os tres elementos da versao anterior.
  current=$(cat state/active-slot 2>/dev/null || true)

  if [[ "$current" != "$initial" ]]; then
    recovered=false
    echo 'ERRO: estado do slot inconsistente.' >&2
  fi

  if ! check_old_proxy; then
    recovered=false
    echo 'ERRO: proxy anterior nao confirmado.' >&2
  fi

  if ! wait_for_worker "$old_worker"; then
    recovered=false
    echo 'ERRO: worker anterior nao responde.' >&2
  fi

  if [[ "$recovered" == true ]]; then
    rm -f state/release-pending
    echo 'Rollback confirmado. Release nao aplicada.' >&2
  else
    echo 'ALERTA CRITICO: recuperacao incompleta.' >&2
    echo 'O deployment permanece bloqueado.' >&2
    echo 'Reconciliar manualmente antes de repetir.' >&2
  fi

  (( rc != 0 )) || rc=1
  exit "$rc"
}


trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# A paragem do worker pode demorar enquanto termina tarefas.
# Nao marcar a operacao como concluida antes de verificar o resultado.
stop_attempted=true

docker stop --time -1 "$old_worker" >/dev/null

worker_state=$(docker inspect \
  -f '{{.State.Running}}' "$old_worker")

if [[ "$worker_state" != false ]]; then
  echo 'ERRO: Celery antigo nao parou corretamente.' >&2
  exit 1
fi

# Autorizar exclusivamente esta tentativa de alternancia.
touch state/switch-enabled
switch_attempted=true

bash "$src/switch-traffic.sh" --apply

rm -f state/switch-enabled

# Iniciar o Celery com a mesma imagem do backend publicado.
"${worker[@]}" up -d \
  --no-build --force-recreate worker

new_worker=financewebapp-live-worker-worker-1
ready=false

for _ in {1..15}; do
  node=$(docker inspect -f '{{.Config.Hostname}}' \
	"$new_worker" 2>/dev/null || true)

  if [[ -n "$node" ]] &&
	 docker exec "$new_worker" \
	   celery -A backend inspect ping \
	   --destination="celery@$node" \
	   --timeout=3 --json 2>/dev/null |
	   python3 -c 'import json,sys; d=json.load(sys.stdin); assert any(v.get("ok")=="pong" for v in d.values())' \
	   >/dev/null 2>&1; then
	ready=true
	break
  fi

  sleep 2
done

[[ "$ready" == true ]] || {
  echo 'ERRO: novo Celery nao respondeu.' >&2
  exit 1
}

# Confirmar o destino efetivo do Caddy.
for spec in \
  'finance.hugo-hadden.com|9080|/' \
  'financeapi.hugo-hadden.com|9000|/health/'; do

  IFS='|' read -r host port path <<< "$spec"

  headers=$(curl -fsS --max-time 5 -D - -o /dev/null \
	-H "Host: $host" \
	-H 'X-Forwarded-Proto: https' \
	"http://127.0.0.1:${port}${path}")

  grep -qiE "^X-BlueGreen-Slot: ${next}[[:space:]]*$" \
	<<< "$headers" || {
	  echo "ERRO: destino incorreto em $host." >&2
	  exit 1
	}
done

release_ok=true
echo "SUCESSO: $next ativo; release $sha; backend/Celery $BACKEND_SHA; frontend $FRONTEND_SHA."
