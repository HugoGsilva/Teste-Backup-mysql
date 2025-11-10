#!/bin/sh
set -e

BACKUP_DIR="/backups"
LATEST=$(ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | head -n 1 || true)

if [ -z "$LATEST" ]; then
  echo "No backup found in $BACKUP_DIR" >&2
  exit 1
fi

MYSQL_HOST="${MYSQL_HOST:-db}"
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-}"
MYSQL_DATABASE="${MYSQL_DATABASE:-test_db}"

if [ -n "$MYSQL_PASSWORD" ]; then
  mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < "$LATEST"
else
  mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" "$MYSQL_DATABASE" < "$LATEST"
fi

echo "$LATEST"
