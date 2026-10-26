
#!/usr/bin/env bash
set -euo pipefail

src="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/bin" "$tmp/state"
printf 'legacy-blue\n' > "$tmp/state/active-slot"

# Substituir os comandos reais por simulacoes locais.
cat > "$tmp/bin/docker" <<'MOCK'
#!/usr/bin/env sh
if [ "$1" = inspect ]; then
  echo true
  exit 0
fi
echo "ERRO: comando Docker inesperado" >&2
exit 1
MOCK

cat > "$tmp/bin/git" <<'MOCK'
#!/usr/bin/env sh
if [ "$1" = ls-remote ]; then
  printf '%040d\trefs/heads/main\n' 0
  exit 0
fi
exit 1
MOCK

cat > "$tmp/bin/curl" <<'MOCK'
#!/usr/bin/env sh
case " $* " in
  *"/health/"*)
    printf '404'
    ;;
  *"-D -"*)
    printf 'HTTP/1.1 200 OK\r\n\r\n'
    ;;
  *)
    exit 1
    ;;
esac
MOCK

chmod +x "$tmp/bin/docker" "$tmp/bin/git" "$tmp/bin/curl"

export PATH="$tmp/bin:$PATH"
export BG_ROOT="$tmp"

echo '=== CENARIO 1: precheck valido ==='
bash "$src/release.sh" --check

test "$(cat "$tmp/state/active-slot")" = legacy-blue
test ! -e "$tmp/state/release-pending"

echo 'PASSOU: nenhuma mudanca de slot'

echo '=== CENARIO 2: release pendente ==='
touch "$tmp/state/release-pending"

if bash "$src/release.sh" --check; then
  echo 'FALHA: permitiu release pendente'
  exit 1
fi

rm "$tmp/state/release-pending"
echo 'PASSOU: release pendente bloqueada'

echo '=== CENARIO 3: slot desconhecido ==='
printf 'invalido\n' > "$tmp/state/active-slot"

if bash "$src/release.sh" --check; then
  echo 'FALHA: aceitou slot desconhecido'
  exit 1
fi

echo 'PASSOU: slot desconhecido bloqueado'
echo 'TODOS OS TESTES DE PRECHECK PASSARAM'


echo '=== CENARIO 4: apply sem autorizacao ==='

printf 'legacy-blue\n' > "$tmp/state/active-slot"

# O apply deve ser rejeitado antes da preparacao.
unset BG_ENABLE_SWITCH

if /bin/bash "$src/release.sh" --apply; then
  echo 'FALHA: apply executado sem autorizacao'
  exit 1
fi

test "$(cat "$tmp/state/active-slot")" = legacy-blue
test ! -e "$tmp/state/release-pending"

echo 'PASSOU: apply sem autorizacao bloqueado'

echo '=== CENARIO 5: falha na preparacao ==='

# Intercetar chamadas aos scripts internos.
# Nunca executar deploy-inactive.sh ou switch-traffic.sh reais.
cat > "$tmp/bin/bash" <<'MOCK'
#!/bin/sh
case "$1" in
  */deploy-inactive.sh)
    echo 'SIMULACAO: falha na preparacao'
    exit 73
    ;;
  */switch-traffic.sh)
    echo 'FALHA: switch nao devia ser chamado' >&2
    exit 99
    ;;
  *)
    echo 'FALHA: chamada bash inesperada' >&2
    exit 98
    ;;
esac
MOCK

chmod +x "$tmp/bin/bash"
export BG_ENABLE_SWITCH=YES

if /bin/bash "$src/release.sh" --apply; then
  echo 'FALHA: release ignorou erro de preparacao'
  exit 1
fi

# Nenhum marcador de troca ou de release deve existir.
test "$(cat "$tmp/state/active-slot")" = legacy-blue
test ! -e "$tmp/state/release-pending"
test ! -e "$tmp/state/switch-enabled"
test ! -e "$tmp/state/switch-pending"

echo 'PASSOU: falha na preparacao nao alterou o slot'
echo 'TODOS OS TESTES DE PRECHECK E PREPARACAO PASSARAM'


echo '=== CENARIO 6: falha do novo Celery ==='

# Restaurar o estado inicial da simulacao.
printf 'legacy-blue\n' > "$tmp/state/active-slot"
printf 'true\n' > "$tmp/old-worker-running"
printf 'legacy-blue\n' > "$tmp/effective-route"

mkdir -p "$tmp/proxy" "$tmp/backups"

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

rm -f "$tmp/state/release-pending" \
      "$tmp/state/switch-pending" \
      "$tmp/state/switch-enabled"

# Simular a preparacao e a troca bem-sucedidas.
# A falha acontece apenas quando tentamos iniciar o Celery.
cat > "$tmp/bin/bash" <<'MOCK'
#!/bin/sh
set -eu

case "$1" in
  */deploy-inactive.sh)
    exit 0
    ;;
  */switch-traffic.sh)
    if [ "${2:-}" = "--apply" ]; then
      printf 'green\n' > "$BG_ROOT/state/active-slot"
      printf 'green\n' > "$BG_ROOT/effective-route"

      sed -i \
        -e 's/127.0.0.1:8080/127.0.0.1:8082/g' \
        -e 's/127.0.0.1:8000/127.0.0.1:8002/g' \
        "$BG_ROOT/proxy/Caddyfile"

      echo 'SIMULACAO: Caddy mudou para Green'
    fi
    exit 0
    ;;
  *)
    echo "ERRO: chamada Bash inesperada: $*" >&2
    exit 98
    ;;
esac
MOCK

cat > "$tmp/bin/docker" <<'MOCK'
#!/bin/sh
set -eu

case "$1" in
  inspect)
    case "$*" in
      *State.Running*)
        if echo "$*" | grep -q 'financewebapp-celery-1'; then
          cat "$BG_ROOT/old-worker-running"
        else
          echo false
        fi
        ;;
      *Config.Hostname*)
        echo oldworker
        ;;
      *)
        exit 98
        ;;
    esac
    ;;
  compose)
    case "$*" in
      *'config --quiet'*)
        exit 0
        ;;
      *'up -d'*)
        echo 'SIMULACAO: novo Celery falhou' >&2
        exit 70
        ;;
      *)
        exit 98
        ;;
    esac
    ;;
  stop)
    echo false > "$BG_ROOT/old-worker-running"
    ;;
  start)
    echo true > "$BG_ROOT/old-worker-running"
    ;;
  exec)
    printf '{"celery@oldworker":{"ok":"pong"}}\n'
    ;;
  kill)
    if grep -q '127.0.0.1:8000' \
      "$BG_ROOT/proxy/Caddyfile"; then
      echo legacy-blue > "$BG_ROOT/effective-route"
    else
      echo green > "$BG_ROOT/effective-route"
    fi
    ;;
  *)
    echo "ERRO: Docker inesperado: $*" >&2
    exit 98
    ;;
esac
MOCK

cat > "$tmp/bin/curl" <<'MOCK'
#!/bin/sh
set -eu

case " $* " in
  *"-w %{http_code}"*)
    if [ "$(cat "$BG_ROOT/effective-route")" = legacy-blue ]; then
      printf '404'
    else
      printf '200'
    fi
    ;;
  *"-D -"*)
    printf 'HTTP/1.1 200 OK\r\n'
    if [ "$(cat "$BG_ROOT/effective-route")" = green ]; then
      printf 'X-BlueGreen-Slot: green\r\n'
    fi
    printf '\r\n'
    ;;
  *)
    exit 98
    ;;
esac
MOCK

cat > "$tmp/bin/sleep" <<'MOCK'
#!/bin/sh
exit 0
MOCK

chmod +x "$tmp/bin/"*

export BG_ENABLE_SWITCH=YES

# A release deve falhar porque o novo Celery nao arrancou.
if /bin/bash "$src/release.sh" --apply; then
  echo 'FALHA: release ignorou o erro do Celery'
  exit 1
fi

# A recuperacao so passa se todos os componentes regressarem a Blue.
test "$(cat "$tmp/state/active-slot")" = legacy-blue
test "$(cat "$tmp/effective-route")" = legacy-blue
test "$(cat "$tmp/old-worker-running")" = true

grep -q 'reverse_proxy 127.0.0.1:8080' \
  "$tmp/proxy/Caddyfile"

grep -q 'reverse_proxy 127.0.0.1:8000' \
  "$tmp/proxy/Caddyfile"

test ! -e "$tmp/state/release-pending"
test ! -e "$tmp/state/switch-pending"
test ! -e "$tmp/state/switch-enabled"

echo 'PASSOU: Blue, Caddy e Celery recuperados'
