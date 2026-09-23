#!/bin/sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-/opt/bank-webapp}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/bank-webapp}"
COMPOSE_ENV_FILE="${COMPOSE_ENV_FILE:-backend/.env}"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
TARGET="$BACKUP_DIR/postgres_${STAMP}.dump"
MEDIA_TARGET="$BACKUP_DIR/media_${STAMP}.tar.gz"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

cd "$PROJECT_DIR"
docker compose --env-file "$COMPOSE_ENV_FILE" -f docker-compose.prod.yml exec -T db \
  sh -c 'pg_dump --format=custom --no-owner --no-acl --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"' \
  > "$TARGET"

sha256sum "$TARGET" > "$TARGET.sha256"

docker compose --env-file "$COMPOSE_ENV_FILE" -f docker-compose.prod.yml exec -T backend \
  tar --create --gzip --file=- --directory=/app/backend media > "$MEDIA_TARGET"
sha256sum "$MEDIA_TARGET" > "$MEDIA_TARGET.sha256"

find "$BACKUP_DIR" -type f -mtime +14 -delete