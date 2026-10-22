
#!/bin/sh

set -eu
umask 077

# Validate the database configuration.
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"

# Configure PostgreSQL client authentication.
export PGPASSWORD="$POSTGRES_PASSWORD"

BACKUP_DIR="/backups"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$BACKUP_DIR"

# Create a unique temporary file.
TEMP_FILE="$(mktemp "$BACKUP_DIR/.financeapp-XXXXXX")"
UNIQUE_ID="${TEMP_FILE##*-}"

BACKUP_FILE="$BACKUP_DIR/financeapp-${TIMESTAMP}-${UNIQUE_ID}.dump"

# Remove incomplete backups when the script exits.
trap 'rm -f "$TEMP_FILE"' EXIT

echo "Creating PostgreSQL backup..."

pg_dump \
    -h "${PGHOST:-db}" \
    -p "${PGPORT:-5432}" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    -Fc \
    -f "$TEMP_FILE"

# Ensure the backup is not empty.
if [ ! -s "$TEMP_FILE" ]; then
    echo "ERROR: Backup file is empty." >&2
    exit 1
fi

echo "Validating backup archive..."

pg_restore --list "$TEMP_FILE" > /dev/null

# Only publish the file after successful validation.
mv "$TEMP_FILE" "$BACKUP_FILE"

echo "Backup completed successfully!"
echo "File: $BACKUP_FILE"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"


# Preview backups older than the retention period.
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

case "$RETENTION_DAYS" in
    ''|*[!0-9]*)
        echo "ERROR: Invalid retention period." >&2
        exit 1
        ;;
esac

if [ "$RETENTION_DAYS" -lt 1 ]; then
    echo "ERROR: Retention must be at least 1 day." >&2
    exit 1
fi


echo "Removing backups older than $RETENTION_DAYS days..."

find "$BACKUP_DIR" \
    -maxdepth 1 \
    -type f \
    -name 'financeapp-*.dump' \
    -mtime "+$((RETENTION_DAYS - 1))" \
    -print \
    -exec rm -f -- {} \;

echo "Backup retention completed."