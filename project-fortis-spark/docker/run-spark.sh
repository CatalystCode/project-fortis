#!/usr/bin/env bash

log() {
  echo "[$(date)] $1"
}

has_site() {
  echo 'SELECT * FROM settings.sitesettings;' | /app/cqlsh | grep -q '(1 rows)'
}

get_token() {
  echo "COPY settings.sitesettings($1) TO STDOUT;" | /app/cqlsh | tr -dC 'A-Za-z0-9'
}

wait_for_token() {
  local token="$1"
  local value=""

  while :; do
    value="$(get_token ${token})"
    if [ -n "${value}" ]; then break; else log "Cognitive Services token ${token} not yet available, waiting..."; sleep 10s; fi
  done
  log "...done, token ${token} is now available with value '${value}'"
}

# wait for cassandra to start
while ! /app/cqlsh; do
  log "Cassandra not yet available, waiting..."
  sleep 10s
done
log "...done, Cassandra is now available"

# wait for cassandra site to be defined
while ! has_site; do
  log "Cassandra site is not yet set up, waiting..."
  sleep 10s
done
log "...done, Cassandra site is now set up"

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

# wait for featureservice
while ! wget -qO- "$FORTIS_FEATURE_SERVICE_HOST/features/name/paris" > /dev/null; do
  log "featureService not yet available, waiting..."
  sleep 30s
done
log "...done, featureService is now available"

spark-submit --driver-memory "${SPARK_DRIVER_MEMORY}" --class "${SPARK_MAINCLASS}" /app/job.jar
