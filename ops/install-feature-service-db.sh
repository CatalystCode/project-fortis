#!/usr/bin/env bash

location="$1"
resource_group="$2"

randomString() { < /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c"$1"; }
randomId() {  < /dev/urandom tr -dc a-z0-9 | head -c"$1"; }

pg_dump="https://fortiscentral.blob.core.windows.net/locations/feature-service.v1.sql.gz"
pg_admin="${FEATUREDB_ADMIN:-fortisadmin}"
pg_user="${FEATUREDB_USER:-frontend}"
pg_name="${FEATUREDB_NAME:-fortis-feature-service-db-$(randomId 8)}"
pg_tier="${FEATUREDB_TIER:-Basic}"
pg_compute="${FEATUREDB_COMPUTEUNITS:-50}"
pg_version="${FEATUREDB_POSTGRESVERSION:-9.6}"
pg_dbname="${FEATUREDB_DBNAME:-geofeatures}"
pg_user_password="$(randomString 32)"
pg_admin_password="$(randomString 32)"

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

dbdump="$(mktemp)"
echo "Finished. Now downloading database dump to ${dbdump}"
curl "${pg_dump}" | gunzip --to-stdout > "${dbdump}"

pg_host="$(az postgres server show --resource-group "${resource_group}" --name "${pg_name}" | jq -r '.fullyQualifiedDomainName')"
echo "Finished. Now populating the database hosted at ${pg_host}"

echo "CREATE DATABASE ${pg_dbname}; CREATE USER ${pg_user} WITH login PASSWORD '${pg_user_password}';" | \
psql "postgresql://${pg_host}:${pg_port}/postgres?user=${pg_admin}@${pg_name}&password=${pg_admin_password}&ssl=true"

< "${dbdump}" \
psql "postgresql://${pg_host}:${pg_port}/${pg_dbname}?user=${pg_admin}@${pg_name}&password=${pg_admin_password}&ssl=true" --quiet
rm "${dbdump}"

FEATURE_SERVICE_DB_CONNECTION_STRING="postgres://${pg_user}@${pg_name}:${pg_user_password}@${pg_host}:5432/${pg_dbname}?ssl=true"
export FEATURE_SERVICE_DB_CONNECTION_STRING

echo "All done installing feature service database"
