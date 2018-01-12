#!/usr/bin/env sh

/opt/cassandra/bin/cqlsh \
  --request-timeout=3600 \
  --username="$CASSANDRA_USERNAME" \
  --password="$CASSANDRA_PASSWORD" \
  "$CASSANDRA_CONTACT_POINTS"
