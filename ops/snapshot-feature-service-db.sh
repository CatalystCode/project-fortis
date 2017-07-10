#!/usr/bin/env bash

readonly pg_conn_str="$1"
readonly blob_account_key="$2"
readonly blob_account_name="${3:-fortiscentral}"
readonly blob_container="${4:-locations}"
readonly pg_version="${FEATUREDB_POSTGRESVERSION:-9.6}"

if [ -z "${pg_conn_str}" ]; then
  echo "Please provide a connection string to the master postgres feature service database" >&2
  exit 1
elif [ -z "${blob_account_key}" ]; then
  echo "Please provide a key to connect to blob" >&2
  exit 1
fi

if ! (command -v jq >/dev/null); then sudo apt-get install -y jq; fi

if ! (command -v pg_dump >/dev/null && pg_dump --version | grep -q "${pg_version}"); then
  sudo add-apt-repository "deb http://apt.postgresql.org/pub/repos/apt/ xenial-pgdg main"
  curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
  sudo apt-get update
  sudo apt-get install -y "postgresql-${pg_version}"
  sudo ln -fs "/usr/lib/postgresql/${pg_version}/bin/pg_dump" /usr/bin/pg_dump
fi

echo "Creating database dump"
dbdump="$(mktemp)"
pg_dump "${pg_conn_str}" | gzip --to-stdout > "${dbdump}"

echo "Finished. Determining dump version"
latest_version="$(az storage blob list \
  --account-name "${blob_account_name}" \
  --account-key "${blob_account_key}" \
  --container-name "${blob_container}" \
| jq -r '.[].name' \
| grep -o '.v[0-9]\+' \
| cut -d'v' -f2 \
| sort -rn \
| head -1)"

if [ -z "${latest_version}" ]; then
  next_version=1
else
  next_version=$((latest_version+1))
fi

echo "Finished. Now uploading new database dump (revision ${next_version}) to Azure"
az storage blob upload \
  --account-name "${blob_account_name}" \
  --account-key "${blob_account_key}" \
  --container-name "${blob_container}" \
  --file "${dbdump}" \
  --name "feature-service.v${next_version}.sql.gz" \
&& rm "${dbdump}"

echo "All done snapshoting feature service database"
