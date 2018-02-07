#!/usr/bin/env bash

has_site() {
  echo 'SELECT * FROM fortis.sitesettings;' | /app/cqlsh | grep -q '(1 rows)'
}

wait_for_token() {
  local token="$1"
  local value=""

  while :; do
    value="$(echo "COPY fortis.sitesettings(${token}) TO STDOUT;" | /app/cqlsh | tr -dC 'A-Za-z0-9')"
    if [ -n "${value}" ]; then break; else echo "Cognitive Services token ${token} not yet available, waiting..."; sleep 10s; fi
  done
  echo "...done, token ${token} is now available with value '${value}'"
}

# wait for cassandra to start
while ! /app/cqlsh; do
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
if [ -n "$COGNITIVE_TRANSLATION_SERVICE_TOKEN" ]; then
  wait_for_token "translationsvctoken"
fi
if [ -n "$COGNITIVE_SPEECH_SERVICE_TOKEN" ]; then
  wait_for_token "cogspeechsvctoken"
fi
if [ -n "$COGNITIVE_VISION_SERVICE_TOKEN" ]; then
  wait_for_token "cogvisionsvctoken"
fi
if [ -n "$COGNITIVE_TEXT_SERVICE_TOKEN" ]; then
  wait_for_token "cogtextsvctoken"
fi

spark-submit --driver-memory "${SPARK_DRIVER_MEMORY}" --class "${SPARK_MAINCLASS}" /app/job.jar
