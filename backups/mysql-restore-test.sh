#!/usr/bin/env bash
set -Eeuo pipefail

ENV_FILE="${MYSQL_BACKUP_ENV_FILE:-/home/ubuntu/secure-backups/env/mysql-backup.env}"
BACKUP_FILE="${1:-}"
RESTORE_DATABASE="${2:-eventmanager_restore_test}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 /path/to/backup.sql.gz [restore_database]" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

case "$RESTORE_DATABASE" in
  ""|*[!A-Za-z0-9_]*)
    echo "Invalid restore database name: $RESTORE_DATABASE" >&2
    exit 1
    ;;
esac

# shellcheck disable=SC1090
source "$ENV_FILE"

SHA_FILE="${BACKUP_FILE}.sha256"

if [ -f "$SHA_FILE" ]; then
  (
    cd "$(dirname "$BACKUP_FILE")"
    sha256sum -c "$(basename "$SHA_FILE")"
  )
else
  echo "Warning: checksum file not found: $SHA_FILE" >&2
fi

docker exec \
  -e MYSQL_PWD="$MYSQL_PASSWORD" \
  "$MYSQL_CONTAINER" \
  mysql \
    -u"$MYSQL_USER" \
    -e "DROP DATABASE IF EXISTS \`${RESTORE_DATABASE}\`; CREATE DATABASE \`${RESTORE_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

gunzip -c "$BACKUP_FILE" \
  | docker exec \
      -i \
      -e MYSQL_PWD="$MYSQL_PASSWORD" \
      "$MYSQL_CONTAINER" \
      mysql \
        -u"$MYSQL_USER" \
        "$RESTORE_DATABASE"

docker exec \
  -e MYSQL_PWD="$MYSQL_PASSWORD" \
  "$MYSQL_CONTAINER" \
  mysql \
    -u"$MYSQL_USER" \
    -e "SHOW TABLES FROM \`${RESTORE_DATABASE}\`;"

echo "Restore test OK in database: $RESTORE_DATABASE"
