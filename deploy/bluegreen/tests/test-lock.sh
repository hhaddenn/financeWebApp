#!/usr/bin/env bash
set -euo pipefail

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

lock="$tmp/deploy.lock"

(
  exec 7>"$lock"
  flock -n 7

  # Um processo filho herda o descritor aberto.
  bash -c '
    test -e /proc/$$/fd/7
    test "$(readlink /proc/$$/fd/7)" = "$1"
  ' bash "$lock"

  echo "PASSOU: descritor herdado pelo processo filho"

  # Um processo independente nao pode adquirir o bloqueio.
  if (
    exec 9>"$lock"
    flock -n 9
  ); then
    echo "FALHA: segundo deployment adquiriu o bloqueio"
    exit 1
  fi

  echo "PASSOU: segundo deployment bloqueado"
)

(
  exec 9>"$lock"
  flock -n 9
)

echo "PASSOU: bloqueio libertado"