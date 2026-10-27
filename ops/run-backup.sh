
#!/usr/bin/env bash
set -euo pipefail

# Required paths and Docker resources are configured privately
# through /etc/financewebapp/backup.conf.

: "${FINANCEAPP_REPO_DIR:?Required}"
: "${FINANCEAPP_ENV_FILE:?Required}"
: "${FINANCEAPP_BACKUP_DIR:?Required}"
: "${FINANCEAPP_DOCKER_NETWORK:?Required}"
: "${FINANCEAPP_MEDIA_VOLUME:?Required}"

backup_script="$FINANCEAPP_REPO_DIR/scripts/backup.sh"

test -f "$backup_script"
test -f "$FINANCEAPP_ENV_FILE"
test -d "$FINANCEAPP_BACKUP_DIR"

exec docker run --rm \
  --network "$FINANCEAPP_DOCKER_NETWORK" \
  --env-file "$FINANCEAPP_ENV_FILE" \
  -e PGHOST=db \
  -e PGPORT=5432 \
  -e BACKUP_RETENTION_ENABLED=true \
  -e BACKUP_RETENTION_DAYS=14 \
  --mount "type=bind,src=$backup_script,dst=/scripts/backup.sh,readonly" \
  --mount "type=bind,src=$FINANCEAPP_BACKUP_DIR,dst=/backups" \
  --mount "type=volume,src=$FINANCEAPP_MEDIA_VOLUME,dst=/media,readonly" \
  --entrypoint /bin/sh \
  postgres:17-alpine \
  /scripts/backup.sh
