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

# start node server
PORT="80" npm start
