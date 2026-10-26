
#!/usr/bin/env bash
set -euo pipefail

src="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/bin" "$tmp/proxy" "$tmp/state" "$tmp/backups"

# Simular os comandos Docker.
cat > "$tmp/bin/docker" <<'MOCK'
#!/bin/sh
set -eu

case "$1" in
  inspect)
    case "$*" in
      *slot_backend*)
        echo "ghcr.io/hhaddenn/financewebapp-backend:$DEPLOY_SHA" ;;
      *slot_frontend*)
        echo "ghcr.io/hhaddenn/financewebapp-frontend:$DEPLOY_SHA" ;;
      *) exit 98 ;;
    esac ;;

  exec)
    case "$*" in
      *'caddy version'*) echo 'v2.11.7' ;;
      *'caddy validate'*) : ;;
      *'manage.py migrate --check'*) : ;;
      *) exit 98 ;;
    esac ;;

  kill)
    count=0
    if [ -f "$BG_ROOT/reload-count" ]; then
      count=$(cat "$BG_ROOT/reload-count")
    fi

    count=$((count + 1))
    echo "$count" > "$BG_ROOT/reload-count"

    if [ "${SCENARIO:-}" = reload_failure ] &&
       [ "$count" -eq 1 ]; then
      exit 40
    fi

    if grep -q 'reverse_proxy 127.0.0.1:8002' \
      "$BG_ROOT/proxy/Caddyfile"; then
      echo green > "$BG_ROOT/effective-route"
    else
      echo legacy-blue > "$BG_ROOT/effective-route"
    fi ;;

  *)
    echo "Docker inesperado: $*" >&2
    exit 98 ;;
esac
MOCK

# Simular as respostas HTTP.
cat > "$tmp/bin/curl" <<'MOCK'
#!/bin/sh
set -eu

url=''
headers=no

for arg in "$@"; do
  case "$arg" in
    http://*) url="$arg" ;;
    -D) headers=yes ;;
  esac
done

case "$url" in
  http://127.0.0.1:8002/*|http://127.0.0.1:8082/*)
    exit 0 ;;

  http://127.0.0.1:9080/*|http://127.0.0.1:9000/*)
    route=$(cat "$BG_ROOT/effective-route")

    if [ "${SCENARIO:-}" = probe_failure ]; then
      route=legacy-blue
    fi

    if [ "$headers" = yes ]; then
      printf 'HTTP/1.1 200 OK\r\n'
      if [ "$route" = green ]; then
        printf 'X-BlueGreen-Slot: green\r\n'
      fi
      printf '\r\n'
    fi ;;

  *)
    echo "URL inesperada: $url" >&2
    exit 98 ;;
esac
MOCK

# Evitar esperas artificiais nos cenarios de erro.
cat > "$tmp/bin/sleep" <<'MOCK'
#!/bin/sh
exit 0
MOCK

chmod +x "$tmp/bin/"*

export BG_ROOT="$tmp"
export BG_RELEASE_INTERNAL=1
export DEPLOY_SHA=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
export PATH="$tmp/bin:$PATH"

reset_case() {
  rm -f "$tmp/state/switch-pending" "$tmp/reload-count"

  echo legacy-blue > "$tmp/state/active-slot"
  echo legacy-blue > "$tmp/effective-route"
  touch "$tmp/state/switch-enabled"

  cat > "$tmp/proxy/Caddyfile" <<'CADDY'
{
 admin off
}
:9080 {
 reverse_proxy 127.0.0.1:8080
}
:9000 {
 reverse_proxy 127.0.0.1:8000
}
CADDY
}

assert_old() {
  test "$(cat "$tmp/state/active-slot")" = legacy-blue
  test "$(cat "$tmp/effective-route")" = legacy-blue

  grep -q 'reverse_proxy 127.0.0.1:8080' \
    "$tmp/proxy/Caddyfile"

  grep -q 'reverse_proxy 127.0.0.1:8000' \
    "$tmp/proxy/Caddyfile"
}

echo '=== CENARIO 1: troca bem-sucedida ==='

reset_case
SCENARIO=success bash "$src/switch-traffic.sh" --apply

test "$(cat "$tmp/state/active-slot")" = green
test "$(cat "$tmp/effective-route")" = green
test ! -e "$tmp/state/switch-pending"

echo 'PASSOU: troca para Green'

echo '=== CENARIO 2: falha no reload do Caddy ==='

reset_case

if SCENARIO=reload_failure \
  bash "$src/switch-traffic.sh" --apply; then
  echo 'FALHA: reload devia falhar' >&2
  exit 1
fi

assert_old
test -f "$tmp/state/switch-pending"

echo 'PASSOU: Blue recuperado e pendencia registada'

echo '=== CENARIO 3: falha na confirmacao do destino ==='

reset_case

if SCENARIO=probe_failure \
  bash "$src/switch-traffic.sh" --apply; then
  echo 'FALHA: confirmacao devia falhar' >&2
  exit 1
fi

assert_old
test -f "$tmp/state/switch-pending"

echo 'PASSOU: proxy restaurado e pendencia registada'

echo 'TODOS OS TESTES DO SWITCH PASSARAM'
