#!/usr/bin/env bash
set -Eeuo pipefail

ENV_FILE="${MYSQL_BACKUP_ENV_FILE:-/home/ubuntu/secure-backups/env/mysql-backup.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

required_vars=(
  MYSQL_CONTAINER
  MYSQL_DATABASE
  MYSQL_USER
  MYSQL_PASSWORD
  BACKUP_DIR
  LOG_FILE
  RETENTION_LOCAL_DAYS
  RETENTION_REMOTE_DAYS
)

for var_name in "${required_vars[@]}"; do
  if [ -z "${!var_name:-}" ]; then
    echo "Missing required variable: $var_name" >&2
    exit 1
  fi
done

TIMESTAMP="$(date +'%Y-%m-%d_%H-%M-%S')"
BACKUP_FILE="${BACKUP_DIR}/${MYSQL_DATABASE}_${TIMESTAMP}.sql.gz"
TMP_FILE="${BACKUP_FILE}.tmp"
SHA_FILE="${BACKUP_FILE}.sha256"
LOCK_FILE="${LOCK_FILE:-/tmp/eventmanager-mysql-backup.lock}"

mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

notify_failure() {
  log "Backup FAILED for ${MYSQL_DATABASE}"

  if [ -n "${ALERT_WEBHOOK_URL:-}" ]; then
    curl -fsS -X POST "$ALERT_WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d "{\"text\":\"Backup MySQL failed for ${MYSQL_DATABASE} on $(hostname)\"}" \
      >/dev/null 2>&1 || true
  fi
}

cleanup_partial() {
  if [ -f "$TMP_FILE" ]; then
    rm -f "$TMP_FILE"
  fi
}

on_exit() {
  status=$?
  if [ "$status" -ne 0 ]; then
    cleanup_partial
    notify_failure
  fi
  exit "$status"
}

trap on_exit EXIT

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "Backup skipped: another backup is already running"
  exit 0
fi

log "Backup started for ${MYSQL_DATABASE}"

docker exec \
  -e MYSQL_PWD="$MYSQL_PASSWORD" \
  "$MYSQL_CONTAINER" \
  mysqldump \
    -u"$MYSQL_USER" \
    --single-transaction \
    --no-tablespaces \
    --routines \
    --triggers \
    --events \
    "$MYSQL_DATABASE" \
  | gzip -9 > "$TMP_FILE"

mv "$TMP_FILE" "$BACKUP_FILE"

(
  cd "$BACKUP_DIR"
  sha256sum "$(basename "$BACKUP_FILE")" > "$(basename "$SHA_FILE")"
)

if [ -n "${REMOTE_TARGET:-}" ]; then
  if ! command -v rclone >/dev/null 2>&1; then
    echo "rclone is required because REMOTE_TARGET is configured" >&2
    exit 1
  fi

  rclone copy "$BACKUP_FILE" "$REMOTE_TARGET/"
  rclone copy "$SHA_FILE" "$REMOTE_TARGET/"
  rclone delete "$REMOTE_TARGET/" \
    --min-age "${RETENTION_REMOTE_DAYS}d" \
    --include "*.sql.gz" \
    --include "*.sha256"
fi

find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +"$RETENTION_LOCAL_DAYS" -delete
find "$BACKUP_DIR" -type f -name "*.sha256" -mtime +"$RETENTION_LOCAL_DAYS" -delete

log "Backup OK: $BACKUP_FILE"
