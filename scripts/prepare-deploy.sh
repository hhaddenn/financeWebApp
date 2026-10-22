
#!/bin/sh
set -eu

# Always run from the project root.
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")"


# Read the effective image reference resolved by Docker Compose.
BACKEND_IMAGE="$(
    docker compose -f docker-compose.prod.yml config --images |
        grep '^ghcr.io/hhaddenn/financewebapp-backend:' |
        head -n 1
)"

BACKEND_TAG="${BACKEND_IMAGE##*:}"

# Production deploys must use a full Git commit SHA.
if ! printf '%s\n' "$BACKEND_TAG" | grep -Eq '^[0-9a-f]{40}$'; then
    echo "ERROR: BACKEND_IMAGE_TAG must be a full 40-character Git SHA." >&2
    echo "Resolved image: $BACKEND_IMAGE" >&2
    exit 1
fi

echo "Preparing backend version: $BACKEND_TAG"

# Validate the frontend image version as well.
FRONTEND_IMAGE="$(
    docker compose -f docker-compose.prod.yml config --images |
        grep '^ghcr.io/hhaddenn/financewebapp-frontend:' |
        head -n 1
)"

FRONTEND_TAG="${FRONTEND_IMAGE##*:}"

if ! printf '%s\n' "$FRONTEND_TAG" | grep -Eq '^[0-9a-f]{40}$'; then
    echo "ERROR: FRONTEND_IMAGE_TAG must be a full 40-character Git SHA." >&2
    echo "Resolved image: $FRONTEND_IMAGE" >&2
    exit 1
fi

echo "Preparing frontend version: $FRONTEND_TAG"

echo "Creating pre-deploy backup..."

docker compose \
    -f docker-compose.prod.yml \
    --profile tools \
    run --rm --no-deps backup

echo "Pre-deploy backup completed."

echo "Pulling application images..."
docker compose -f docker-compose.prod.yml pull backend frontend

echo "Running Django initialization..."
docker compose -f docker-compose.prod.yml --profile tools run --rm --pull never init

echo "Initialization completed successfully."
