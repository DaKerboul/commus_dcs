#!/bin/sh
# pg_dump backup for commus-dcs.
# Run on CT129 (the Docker host) — cron or manually.
# Example cron (daily at 03:00): 0 3 * * * /opt/scripts/backup-db.sh

set -e

BACKUP_DIR="${BACKUP_DIR:-/opt/backups/commus-dcs}"
KEEP_DAYS="${KEEP_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/commus_dcs_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

docker exec commus-dcs-db \
  pg_dump -U commus commus_dcs \
  | gzip > "$BACKUP_FILE"

echo "Backup written: $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"

# Prune old backups
find "$BACKUP_DIR" -name "commus_dcs_*.sql.gz" -mtime +"$KEEP_DAYS" -delete
echo "Pruned backups older than ${KEEP_DAYS} days"

# Optional: copy to remote storage
# scp "$BACKUP_FILE" user@backup-host:/backups/commus-dcs/
