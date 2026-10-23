#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 VOLUME_NAME" >&2
    exit 2
fi

VOLUME_NAME="$1"

# Accept only characters expected in Docker volume names.
case "$VOLUME_NAME" in
    ""|*[!a-zA-Z0-9_.-]*)
        echo "ERROR: Invalid Docker volume name: $VOLUME_NAME" >&2
        exit 2
        ;;
esac

# Avoid accidentally creating a new volume during the audit.
if ! docker volume inspect "$VOLUME_NAME" > /dev/null 2>&1; then
    echo "ERROR: Volume does not exist: $VOLUME_NAME" >&2
    exit 1
fi

echo "Auditing volume: $VOLUME_NAME"

docker run --rm \
    --network none \
    --read-only \
    --user 0:0 \
    --mount "type=volume,src=$VOLUME_NAME,dst=/audit,readonly" \
    --entrypoint sh \
    alpine:3.24 \
    -c '
        set -eu

        mismatches=$(find /audit \
            \( ! -user 10001 -o ! -group 10001 \) \
            -print)

        if [ -n "$mismatches" ]; then
            echo "ERROR: Entries with unexpected ownership:"
            printf "%s\n" "$mismatches"
            exit 1
        fi

        echo "OK: all entries belong to UID/GID 10001"
    '
