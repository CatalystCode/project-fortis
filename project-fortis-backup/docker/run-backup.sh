#!/usr/bin/env sh

while :; do
  sleep "$BACKUP_INTERVAL"
  /app/backup-cassandra-keyspace.sh settings
done
