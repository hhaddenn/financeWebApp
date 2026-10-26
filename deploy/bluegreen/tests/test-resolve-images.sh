#!/usr/bin/env bash
set -euo pipefail

src="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
repo="$tmp/repo"
mkdir -p "$repo/deploy/bluegreen" "$repo/backend" "$repo/frontend" "$tmp/bin"
cp "$src/resolve-images.sh" "$repo/deploy/bluegreen/resolve-images.sh"
cat > "$tmp/bin/docker" <<'MOCK'
#!/bin/sh
[ "$1" = manifest ] && [ "$2" = inspect ] || exit 98
printf '%s\n' "$3" >> "$IMAGE_PROBES"
exit 0
MOCK
chmod +x "$tmp/bin/docker"
export PATH="$tmp/bin:$PATH" IMAGE_PROBES="$tmp/probes"
git -C "$repo" init -q -b main
git -C "$repo" config user.name Test
git -C "$repo" config user.email test@example.invalid
printf 'backend\n' > "$repo/backend/a"
printf 'frontend\n' > "$repo/frontend/a"
git -C "$repo" add .
git -C "$repo" commit -qm 'initial images'
first=$(git -C "$repo" rev-parse HEAD)
printf 'frontend change\n' >> "$repo/frontend/a"
git -C "$repo" commit -qam 'only frontend'
second=$(git -C "$repo" rev-parse HEAD)
printf 'infra change\n' > "$repo/deploy/bluegreen/README"
git -C "$repo" add .
git -C "$repo" commit -qm 'only infra'
third=$(git -C "$repo" rev-parse HEAD)

output=$(bash "$repo/deploy/bluegreen/resolve-images.sh" "$third")
[[ "$output" == "$(printf 'BACKEND_SHA=%s\nFRONTEND_SHA=%s' "$first" "$second")" ]] || {
 echo "ERRO: composicao das imagens: $output" >&2; exit 1;
}
grep -qx "ghcr.io/hhaddenn/financewebapp-backend:$first" "$IMAGE_PROBES"
grep -qx "ghcr.io/hhaddenn/financewebapp-frontend:$second" "$IMAGE_PROBES"

# Checkout stale must fail closed.
if bash "$repo/deploy/bluegreen/resolve-images.sh" "$second" >/dev/null 2>&1; then
 echo 'ERRO: clone desatualizado nao foi bloqueado' >&2; exit 1;
fi

echo 'PASSOU: backend inalterado, frontend atualizado, infra sem rebuild, main sincronizado'
