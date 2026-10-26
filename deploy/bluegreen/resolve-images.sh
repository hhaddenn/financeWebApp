#!/usr/bin/env bash
set -Eeuo pipefail

# Usage: resolve-images.sh RELEASE_SHA
# The repository must contain precisely the approved main commit.
release="${1:?Uso: resolve-images.sh SHA}"
[[ "$release" =~ ^[a-f0-9]{40}$ ]] || { echo 'ERRO: SHA de release invalido.' >&2; exit 1; }
repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"

[[ "$(git -C "$repo" rev-parse refs/heads/main)" == "$release" ]] || {
  echo 'ERRO: clone local de main desatualizado. Atualizar o Repo no Komodo.' >&2
  exit 1
}

resolve() {
  local component="$1" sha image
  shift
  # With --first-parent, the tag is the main commit that triggered Docker Publish.
  # The path filters must match .github/workflows/docker-build.yml.
  sha=$(git -C "$repo" log --first-parent -1 --format=%H "$release" -- "$@")
  [[ "$sha" =~ ^[a-f0-9]{40}$ ]] || {
    echo "ERRO: nao foi encontrado build para $component." >&2
    return 1
  }
  image="ghcr.io/hhaddenn/financewebapp-${component}:${sha}"
  docker manifest inspect "$image" >/dev/null || {
    echo "ERRO: imagem nao publicada ou inacessivel: $image" >&2
    return 1
  }
  printf '%s' "$sha"
}

backend=$(resolve backend backend/ requirements.txt requirements-translations.txt ops/backend-entrypoint.sh .github/workflows/docker-build.yml)
frontend=$(resolve frontend frontend/ .github/workflows/docker-build.yml)
printf 'BACKEND_SHA=%s\nFRONTEND_SHA=%s\n' "$backend" "$frontend"
