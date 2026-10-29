#!/bin/sh
set -eu

# Always run from the project root.
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")"

# Rollback must be explicitly requested.
case "${1:-}" in
    "")
        ROLLBACK=false
        ;;
    --rollback)
        ROLLBACK=true
        ;;
    *)
        echo "ERROR: Unknown argument: $1" >&2
        echo "Usage: prepare-deploy.sh [--rollback]" >&2
        exit 2
        ;;
esac

resolve_image() {
    NAME="$1"

    # Read the effective image reference resolved by Docker Compose.
    docker compose -f docker-compose.prod.yml config --images |
        grep "^ghcr.io/hhaddenn/financewebapp-${NAME}:" |
        head -n 1
}

check_version() {
    NAME="$1"
    VAR="$2"

    IMAGE="$(resolve_image "$NAME")"

    TAG="${IMAGE##*:}"

    # Accept latest or a full Git SHA; rollback requires a SHA.
    case "$TAG" in
        latest)
            if [ "$ROLLBACK" = "true" ]; then
                echo "ERROR: ${VAR} must be a full 40-character Git SHA, not latest." >&2
                echo "Resolved image: $IMAGE" >&2
                exit 1
            fi
            ;;
        *)
            if ! printf '%s\n' "$TAG" | grep -Eq '^[0-9a-f]{40}$'; then
                echo "ERROR: ${VAR} must be latest or a full 40-character Git SHA." >&2
                echo "Resolved image: $IMAGE" >&2
                exit 1
            fi
            ;;
    esac

    echo "Preparing ${NAME} version: $TAG"
}

show_revision() {
    NAME="$1"
    IMAGE="$(resolve_image "$NAME")"
    LABEL="$(docker image inspect --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' "$IMAGE")"

    if [ -z "$LABEL" ]; then
        echo "WARNING: ${NAME} image has no revision label; version unknown." >&2
    else
        echo "${NAME} image revision: ${LABEL}"
    fi
}

check_version backend BACKEND_IMAGE_TAG
check_version frontend FRONTEND_IMAGE_TAG

echo "Creating pre-deploy backup..."

docker compose \
    -f docker-compose.prod.yml \
    --profile tools \
    run --rm --no-deps backup

echo "Pre-deploy backup completed."

echo "Pulling application images..."
docker compose -f docker-compose.prod.yml pull backend frontend

show_revision backend
show_revision frontend

if [ "$ROLLBACK" = "true" ]; then
    echo "Rollback mode: skipping Django initialization."
    exit 0
fi

echo "Running Django initialization..."
docker compose -f docker-compose.prod.yml --profile tools run --rm --pull never init

echo "Initialization completed successfully."
