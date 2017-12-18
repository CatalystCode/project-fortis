#!/usr/bin/env sh

cassandra_exec() {
  /opt/cassandra/bin/cqlsh \
    --request-timeout=3600 \
    --username="$CASSANDRA_USERNAME" \
    --password="$CASSANDRA_PASSWORD" \
    "$CASSANDRA_CONTACT_POINTS"
}

has_cassandra_schema() {
  echo 'DESCRIBE KEYSPACE fortis;' | cassandra_exec 2>&1 | grep -q 'CREATE KEYSPACE fortis'
}

has_seed_data() {
  echo 'SELECT eventid FROM fortis.events LIMIT 100;' | cassandra_exec | grep -q '(100 rows)'
}

has_site() {
  echo 'SELECT * FROM fortis.sitesettings;' | cassandra_exec | grep -q '(1 rows)'
}

get_sitename() {
  echo 'COPY fortis.sitesettings(sitename) TO STDOUT;' | cassandra_exec | tr -d '\r'
}

ingest_users_with_role() {
  echo "$2" \
  | tr ',' '\n' \
  | sed "s/^\(.*\)$/INSERT INTO fortis.users(identifier, role) VALUES ('\1', '$1') IF NOT EXISTS;/g" \
  | tr '\n' ' ' \
  | cassandra_exec
}

# wait for cassandra to start
while ! cassandra_exec; do
  echo "Cassandra not yet available, waiting..."
  sleep 10s
done
echo "...done, Cassandra is now available"

# set up cassandra schema
if [ -n "$FORTIS_CASSANDRA_SCHEMA_URL" ] && ! has_cassandra_schema; then
  echo "Got Fortis schema definition at $FORTIS_CASSANDRA_SCHEMA_URL, ingesting..."
  wget -qO- "$FORTIS_CASSANDRA_SCHEMA_URL" \
  | sed "s@'replication_factor' *: *[0-9]\+@'replication_factor': $FORTIS_CASSANDRA_REPLICATION_FACTOR@g" \
  | cassandra_exec
  echo "...done, Fortis schema definition is now ingested"
fi

# set up users
if [ -n "$FORTIS_CASSANDRA_USERS" ]; then
  echo "Got Fortis users, ingesting..."
  ingest_users_with_role 'user' "$FORTIS_CASSANDRA_USERS"
  echo "...done, Fortis users are now ingested"
fi

# set up admins
if [ -n "$FORTIS_CASSANDRA_ADMINS" ]; then
  echo "Got Fortis admins, ingesting..."
  ingest_users_with_role 'user' "$FORTIS_CASSANDRA_ADMINS"
  ingest_users_with_role 'admin' "$FORTIS_CASSANDRA_ADMINS"
  echo "...done, Fortis admins are now ingested"
fi

# set up cassandra seed data
if [ -n "$FORTIS_CASSANDRA_SEED_DATA_URL" ] && ! has_seed_data; then
  echo "Got Fortis sample data at $FORTIS_CASSANDRA_SEED_DATA_URL, ingesting..."
  mkdir -p /tmp/cassandra-seed-data
  cd /tmp/cassandra-seed-data
  wget -qO- "$FORTIS_CASSANDRA_SEED_DATA_URL" | tar xzf -
  cassandra_exec < import.cql
  cd -
  echo "...done, Fortis sample data is now ingested"
fi

# set up site entry
if [ -n "$FORTIS_CASSANDRA_SITE_NAME" ] && [ -n "$FORTIS_CASSANDRA_SITE_TYPE" ] && ! has_site; then
  echo "Got Fortis site name and type, ingesting default site settings..."
  npm run createsite -- "$FORTIS_CASSANDRA_SITE_NAME" "$FORTIS_CASSANDRA_SITE_TYPE"
  if [ $? -ne 0 ]; then echo "Failed to create site!" >&2; exit 1; fi
  echo "...done, Fortis default site is now ingested"
fi

# set up cognitive services secrets if preconfigured
if [ -n "$translationsvctoken" ] && [ -n "$cogspeechsvctoken" ] && [ -n "$cogvisionsvctoken" ] && [ -n "$cogtextsvctoken" ]; then
  echo "Got Fortis cognitive services secrets, ingesting..."
  echo "UPDATE fortis.sitesettings SET translationsvctoken = '$translationsvctoken', cogspeechsvctoken = '$cogspeechsvctoken', cogvisionsvctoken = '$cogvisionsvctoken', cogtextsvctoken = '$cogtextsvctoken' WHERE sitename = '$(get_sitename)';" | cassandra_exec
  echo "...done, Fortis cognitive services secrets are now ingested"
fi

# start node server
PORT="80" npm start
