#!/usr/bin/env bash

readonly location="$1"
readonly resource_group="$2"

randomId() {  < /dev/urandom tr -dc a-z0-9 | head -c"$1"; }

readonly pg_dump="https://fortiscentral.blob.core.windows.net/locations/feature-service.v1.sql.gz"
readonly pg_admin="${FEATUREDB_ADMIN:-fortisadmin}"
readonly pg_user="${FEATUREDB_USER:-frontend}"
readonly pg_name="${FEATUREDB_NAME:-fortis-feature-service-db-$(randomId 8)}"
readonly pg_tier="${FEATUREDB_TIER:-Basic}"
readonly pg_compute="${FEATUREDB_COMPUTEUNITS:-50}"
readonly pg_version="${FEATUREDB_POSTGRESVERSION:-9.6}"
readonly pg_dbname="${FEATUREDB_DBNAME:geofeatures}"
readonly pg_user_password="$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c"${PASSWORD_COMPLEXITY:-32}")"
readonly pg_admin_password="$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c"${PASSWORD_COMPLEXITY:-32}")"

if ! (command -v jq >/dev/null); then sudo apt-get install -y jq; fi
if ! (command -v psql >/dev/null); then sudo apt-get install -y postgresql postgresql-contrib; fi

echo "Creating postgres server ${pg_name}"
az postgres server create \
  --resource-group "${resource_group}" \
  --name "${pg_name}" \
  --location "${location}" \
  --admin-user "${pg_admin}" \
  --admin-password "${pg_admin_password}" \
  --performance-tier "${pg_tier}" \
  --compute-units "${pg_compute}" \
  --version "${pg_version}"

echo "Finished. Now opening up database server firewall"
az postgres server firewall-rule create \
  --resource-group "${resource_group}" \
  --server "${pg_name}" \
  --name AllowAllIps \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255

echo "Finished. Now downloading database dump"
dbdump="$(mktemp)"
curl "${pg_dump}" | gunzip --to-stdout > "${dbdump}"

echo "Finished. Now populating the database"
pg_host="$(az postgres server show --resource-group "${resource_group}" --name "${pg_name}" | jq -r '.fullyQualifiedDomainName')"

echo "CREATE DATABASE ${pg_dbname}; CREATE USER ${pg_user} WITH login PASSWORD '${pg_user_password}';" | \
PGPASSWORD="${pg_admin_password}" psql \
  --host "${pg_host}" \
  --port 5432 \
  --username "${pg_admin}@${pg_name}" \
  --quiet

<"${dbdump}" \
PGPASSWORD="${pg_admin_password}" psql \
  --host "${pg_host}" \
  --port 5432 \
  --username "${pg_admin}@${pg_name}" \
  --dbname "${pg_dbname}" \
  --quiet
rm "${dbdump}"

FEATURE_SERVICE_DB_CONNECTION_STRING="postgres://${pg_user}@${pg_name}:${pg_admin_password}@${pg_host}:5432/${pg_dbname}?ssl=true"
export FEATURE_SERVICE_DB_CONNECTION_STRING

echo "All done installing feature service database"
