#!/usr/bin/env bash

cassandra_exec() {
  /opt/cassandra/bin/cqlsh \
    --request-timeout=3600 \
    --username="$FORTIS_CASSANDRA_USERNAME" \
    --password="$FORTIS_CASSANDRA_PASSWORD" \
    "$FORTIS_CASSANDRA_HOST"
}

# wait for cassandra to start
while ! cassandra_exec; do
  echo "Cassandra not yet available, waiting..."
  sleep 10s
done
echo "...done, Cassandra is now available"

# wait for cassandra schema to be defined
while ! echo 'select * from fortis.sitesettings;' | cassandra_exec | grep -q '(1 rows)'; do
  echo "Cassandra schema is not yet complete, waiting..."
  sleep 10s
done
echo "...done, Cassandra schema is now complete"

readonly spark_jar="$(find /app/target -name '*-assembly-0.0.0.jar' -exec readlink -f {} \; -quit)"
spark-submit --driver-memory "${SPARK_DRIVER_MEMORY}" --class "${SPARK_MAINCLASS}" "${spark_jar}"
