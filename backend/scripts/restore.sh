#!/usr/bin/env bash
set -euo pipefail
FILE=${1:-}
DB_URL=${DATABASE_URL:-}
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then echo "Usage: $0 path/to/backup.sql.gz"; exit 1; fi
if [ -z "$DB_URL" ]; then echo "DATABASE_URL not set"; exit 1; fi

gunzip -c "$FILE" | psql "$DB_URL"
echo "Restore completed from $FILE"
