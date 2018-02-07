#!/usr/bin/env sh

/opt/cassandra/bin/cqlsh \
  --request-timeout=3600 \
  --username="$FORTIS_CASSANDRA_USERNAME" \
  --password="$FORTIS_CASSANDRA_PASSWORD" \
  "$FORTIS_CASSANDRA_HOST" \
  "$FORTIS_CASSANDRA_PORT"
