#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_DIR:=/var/backups/campus-food}"

mkdir -p "$BACKUP_DIR"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$BACKUP_DIR/campus_food_$stamp.dump"

pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" > "$target"
sha256sum "$target" > "$target.sha256"
find "$BACKUP_DIR" -type f -mtime +14 -delete

echo "$target"
