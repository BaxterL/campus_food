#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${1:?usage: restore-postgres.sh backup.dump}"

backup="$1"
sha256sum -c "$backup.sha256"
pg_restore --clean --if-exists --no-owner --no-acl --dbname "$DATABASE_URL" "$backup"
