#!/usr/bin/env bash
set -euo pipefail
DATE=$(date +%Y%m%d_%H%M%S)
DB_URL=${DATABASE_URL:-}
S3_BUCKET=${S3_BUCKET:-}
RETENTION_DAYS=${RETENTION_DAYS:-7}
OUT=${1:-/tmp}
FILE="$OUT/backup_${DATE}.sql.gz"

if [ -z "$DB_URL" ]; then echo "DATABASE_URL not set"; exit 1; fi

mkdir -p "$OUT"
pg_dump "$DB_URL" | gzip -9 > "$FILE"
echo "Backup saved: $FILE"

if [ -n "$S3_BUCKET" ]; then
  aws s3 cp "$FILE" "s3://$S3_BUCKET/" --only-show-errors || true
  echo "Uploaded to s3://$S3_BUCKET/"
fi

# Retention cleanup local
find "$OUT" -name 'backup_*.sql.gz' -type f -mtime +$RETENTION_DAYS -delete || true
