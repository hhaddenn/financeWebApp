
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


# Create temporary files for both backups.
TEMP_FILE="$(mktemp "$BACKUP_DIR/.financeapp-XXXXXX")"
MEDIA_TEMP_FILE="$(mktemp "$BACKUP_DIR/.financeapp-media-XXXXXX")"

UNIQUE_ID="${TEMP_FILE##*-}"

BACKUP_FILE="$BACKUP_DIR/financeapp-${TIMESTAMP}-${UNIQUE_ID}.dump"
MEDIA_BACKUP_FILE="$BACKUP_DIR/financeapp-media-${TIMESTAMP}-${UNIQUE_ID}.tar.gz"

PUBLISHED=false

cleanup() {
    rm -f "$TEMP_FILE" "$MEDIA_TEMP_FILE"

    if [ "$PUBLISHED" != "true" ]; then
        rm -f "$BACKUP_FILE" "$MEDIA_BACKUP_FILE"
    fi
}

trap cleanup EXIT

# 1. Back up PostgreSQL.
echo "Creating PostgreSQL backup..."

pg_dump \
    -h "${PGHOST:-db}" \
    -p "${PGPORT:-5432}" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    -Fc \
    -f "$TEMP_FILE"

if [ ! -s "$TEMP_FILE" ]; then
    echo "ERROR: PostgreSQL backup is empty." >&2
    exit 1
fi

echo "Validating PostgreSQL backup..."
pg_restore --list "$TEMP_FILE" > /dev/null

# 2. Back up media files.
echo "Creating media backup..."

tar -czf "$MEDIA_TEMP_FILE" -C /media .

if [ ! -s "$MEDIA_TEMP_FILE" ]; then
    echo "ERROR: Media backup is empty." >&2
    exit 1
fi

echo "Validating media backup..."
tar -tzf "$MEDIA_TEMP_FILE" > /dev/null

# 3. Publish both archives after validation.
mv "$TEMP_FILE" "$BACKUP_FILE"
mv "$MEDIA_TEMP_FILE" "$MEDIA_BACKUP_FILE"

PUBLISHED=true

echo "Backup completed successfully!"
echo "Database: $BACKUP_FILE"
echo "Media: $MEDIA_BACKUP_FILE"
echo "Database size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "Media size: $(du -h "$MEDIA_BACKUP_FILE" | cut -f1)"


# Remove old backups only when retention is explicitly enabled.
if [ "${BACKUP_RETENTION_ENABLED:-false}" = "true" ]; then
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


	echo "Removing complete backup pairs older than $RETENTION_DAYS days..."

	find "$BACKUP_DIR" \
		-maxdepth 1 \
		-type f \
		-name 'financeapp-*.dump' \
		-mtime "+$((RETENTION_DAYS - 1))" \
		-print |
	while IFS= read -r db_file; do
		filename="${db_file##*/}"
		backup_id="${filename#financeapp-}"
		backup_id="${backup_id%.dump}"

		media_file="$BACKUP_DIR/financeapp-media-${backup_id}.tar.gz"

		# Preserve incomplete pairs for investigation.
		if [ ! -f "$media_file" ]; then
			echo "Skipping incomplete pair: $backup_id"
			continue
		fi

		# Both files must be older than the retention period.
		if [ -z "$(find "$media_file" -type f -mtime "+$((RETENTION_DAYS - 1))" -print)" ]; then
			echo "Skipping pair with recent media: $backup_id"
			continue
		fi

		echo "Removing backup pair: $backup_id"

		rm -f -- "$db_file" "$media_file"
	done

	echo "Backup retention completed."

else
    echo "Backup retention disabled."
fi
