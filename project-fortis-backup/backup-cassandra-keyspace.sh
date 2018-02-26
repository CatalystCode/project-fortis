#!/usr/bin/env bash

readonly keyspace="$1"

readonly export_root="$(mktemp -d /tmp/fortis-backup-XXXXXX)"
readonly export_dir="${export_root}/${keyspace}/$(date --utc +'%Y/%m/%d/%H')"

cleanup() { rm -rf "${export_root}"; }
trap cleanup EXIT

log() {
  echo "[$(date)] $1" >&2
}

list_tables() {
  echo "USE ${keyspace}; DESCRIBE TABLES;" \
  | /app/cqlsh \
  | grep -v '^$' \
  | sed 's@ \+@\n@g'
}

has_keyspace() {
  echo 'DESCRIBE KEYSPACES;' \
  | /app/cqlsh \
  | grep -q "${keyspace}"
}

export_table() {
  local table_name="$1"

  local export_path="${export_dir}/${table_name}.csv.gz"

  echo "USE ${keyspace}; COPY ${table_name} TO STDOUT;" \
  | /app/cqlsh \
  | gzip --to-stdout > "${export_path}"
}

check_preconditions() {
  while ! has_keyspace; do
    log "Cassandra not available, waiting..."
    sleep 1m
  done
  log "...done, Cassandra is now available"
}

prepare_resources() {
  az storage container create \
    --account-name="${USER_FILES_BLOB_ACCOUNT_NAME}" \
    --account-key="${USER_FILES_BLOB_ACCOUNT_KEY}" \
    --name="${BACKUP_CONTAINER_NAME}"

  mkdir -p "${export_dir}"
}

export_tables() {
  list_tables | while read -r table_name; do
    log "Exporting table ${table_name}..."
    export_table "${table_name}"
    log "...done, table ${table_name} is now exported"
  done
}

upload_backups() {
  log "Uploading backups..."
  az storage blob upload-batch \
    --account-name="${USER_FILES_BLOB_ACCOUNT_NAME}" \
    --account-key="${USER_FILES_BLOB_ACCOUNT_KEY}" \
    --destination="${BACKUP_CONTAINER_NAME}" \
    --source="${export_root}" \
    --no-progress
  log "...done, backups are now uploaded"
}

delete_old_backups() {
  log "Deleting old backups..."
  az storage blob delete-batch \
    --account-name="${USER_FILES_BLOB_ACCOUNT_NAME}" \
    --account-key="${USER_FILES_BLOB_ACCOUNT_KEY}" \
    --source="${BACKUP_CONTAINER_NAME}" \
    --delete-snapshots="include" \
    --pattern="${BACKUP_CONTAINER_NAME}/$(date --utc --date="${BACKUP_DELETE_LOOKBACK}" '+%Y/%m/%d')/*"
  log "...done, old backups are now deleted"
}

check_preconditions
prepare_resources
export_tables
upload_backups
delete_old_backups
