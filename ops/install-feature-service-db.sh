#!/usr/bin/env bash

fs__location="$1"
fs__resource_group="$2"

fs__randomString() { < /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c"$1"; }
fs__randomId() { < /dev/urandom tr -dc a-z0-9 | head -c"$1"; }

fs__pg_dump="https://fortiscentral.blob.core.windows.net/locations/feature-service.v2.sql.gz"
fs__pg_admin="${FEATUREDB_ADMIN:-fortisadmin}"
fs__pg_name="${FEATUREDB_NAME:-fortis-feature-service-db-$(fs__randomId 8)}"
fs__pg_tier="${FEATUREDB_TIER:-Basic}"
fs__pg_compute="${FEATUREDB_COMPUTEUNITS:-50}"
fs__pg_version="${FEATUREDB_POSTGRESVERSION:-9.6}"
fs__pg_user_password_ops="$(fs__randomString 32)"
fs__pg_user_password_frontend="$(fs__randomString 32)"
fs__pg_admin_password="$(fs__randomString 32)"

if ! (command -v jq >/dev/null); then sudo apt-get install -y jq; fi
if ! (command -v psql >/dev/null); then sudo apt-get install -y postgresql postgresql-contrib; fi

echo "Creating postgres server ${fs__pg_name}"
az postgres server create \
  --resource-group "${fs__resource_group}" \
  --name "${fs__pg_name}" \
  --location "${fs__location}" \
  --admin-user "${fs__pg_admin}" \
  --admin-password "${fs__pg_admin_password}" \
  --performance-tier "${fs__pg_tier}" \
  --compute-units "${fs__pg_compute}" \
  --version "${fs__pg_version}"

echo "Finished. Now opening up database server firewall"
az postgres server firewall-rule create \
  --resource-group "${fs__resource_group}" \
  --server "${fs__pg_name}" \
  --name AllowAllIps \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255

fs__dbdump="$(mktemp)"
echo "Finished. Now downloading database dump to ${fs__dbdump}"
curl "${fs__pg_dump}" | gunzip --to-stdout > "${fs__dbdump}"

fs__pg_host="$(az postgres server show --resource-group "${fs__resource_group}" --name "${fs__pg_name}" | jq -r '.fullyQualifiedDomainName')"
echo "Finished. Now populating the database hosted at ${fs__pg_host}"

echo "CREATE DATABASE features; CREATE USER ops WITH login PASSWORD '${fs__pg_user_password_ops}'; CREATE USER frontend WITH login PASSWORD '${fs__pg_user_password_frontend}';" | \
psql "postgresql://${fs__pg_host}:5432/postgres?user=${fs__pg_admin}@${fs__pg_name}&password=${fs__pg_admin_password}&ssl=true"

< "${fs__dbdump}" \
psql "postgresql://${fs__pg_host}:5432/features?user=${fs__pg_admin}@${fs__pg_name}&password=${fs__pg_admin_password}&ssl=true" --quiet
rm "${fs__dbdump}"

FEATURE_SERVICE_DB_CONNECTION_STRING="postgres://frontend@${fs__pg_name}:${fs__pg_user_password_frontend}@${fs__pg_host}:5432/features?ssl=true"
FEATURE_SERVICE_DB_CONNECTION_STRING_2="postgres://ops@${fs__pg_name}:${fs__pg_user_password_ops}@${fs__pg_host}:5432/features?ssl=true"
export FEATURE_SERVICE_DB_CONNECTION_STRING
export FEATURE_SERVICE_DB_CONNECTION_STRING_2

echo "All done installing feature service database"
