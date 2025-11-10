#!/bin/sh
set -e

MYSQL_HOST="${MYSQL_HOST:-db}"
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-}"
MYSQL_DATABASE="${MYSQL_DATABASE:-test_db}"
BACKUP_DIR="/backups"

mkdir -p "$BACKUP_DIR"

FILE="$BACKUP_DIR/backup-$(date +%Y%m%d%H%M%S).sql"

if [ -n "$MYSQL_PASSWORD" ]; then
  mysqldump -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" > "$FILE"
else
  mysqldump -h "$MYSQL_HOST" -u "$MYSQL_USER" "$MYSQL_DATABASE" > "$FILE"
fi

echo "$FILE"
