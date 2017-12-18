#!/usr/bin/env bash

cassandra_exec() {
  /opt/cassandra/bin/cqlsh \
    --request-timeout=3600 \
    --username="$FORTIS_CASSANDRA_USERNAME" \
    --password="$FORTIS_CASSANDRA_PASSWORD" \
    "$FORTIS_CASSANDRA_HOST"
}

has_site() {
  echo 'SELECT * FROM fortis.sitesettings;' | cassandra_exec | grep -q '(1 rows)'
}

get_tokens() {
  echo 'COPY fortis.sitesettings(translationsvctoken,cogspeechsvctoken,cogvisionsvctoken,cogtextsvctoken) TO STDOUT;' | cassandra_exec | tr -dC '[A-Za-z0-9]'
}

# wait for cassandra to start
while ! cassandra_exec; do
  echo "Cassandra not yet available, waiting..."
  sleep 10s
done
echo "...done, Cassandra is now available"

# wait for cassandra site to be defined
while ! has_site; do
  echo "Cassandra site is not yet set up, waiting..."
  sleep 10s
done
echo "...done, Cassandra site is now set up"

# wait for cognitive services secrets if preconfigured
if [ -n "$translationsvctoken" ] && [ -n "$cogspeechsvctoken" ] && [ -n "$cogvisionsvctoken" ] && [ -n "$cogtextsvctoken" ]; then
  while [ -z "$(get_tokens)" ]; do
    echo "Cognitive Services tokens not yet available, waiting..."
    sleep 10s
  done
  echo "...done, Cognitive Services secrets are now available"
fi

readonly spark_jar="$(find /app/target -name '*-assembly-0.0.0.jar' -exec readlink -f {} \; -quit)"
spark-submit --driver-memory "${SPARK_DRIVER_MEMORY}" --class "${SPARK_MAINCLASS}" "${spark_jar}"
