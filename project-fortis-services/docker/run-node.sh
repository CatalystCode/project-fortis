#!/usr/bin/env sh

log() {
  echo "[$(date)] $1"
}

has_keyspace() {
  echo 'DESCRIBE KEYSPACES;' | /app/cqlsh | grep -q "$1"
}

has_seed_data() {
  echo 'SELECT * FROM settings.sitesettings;' | /app/cqlsh | grep -q '(1 rows)'
}

has_site() {
  echo 'SELECT sitename FROM settings.sitesettings;' | /app/cqlsh | grep -q "$FORTIS_CASSANDRA_SITE_NAME"
}

ingest_schema() {
  local url="$1"
  local keyspace="$2"
  local cqlfile="$(mktemp -d /tmp/cassandra-schema-XXXXXX)/setup-$keyspace.cql"

  if ! wget -qO- "$url" > "$cqlfile"; then
    log "No schema definition found at $url"
    rm -rf "$(dirname "$cqlfile")"
    return
  fi

  log "Got schema definition at $url, ingesting..."
  sed -i "s@'replication_factor' *: *[0-9]\+@'replication_factor': $FORTIS_CASSANDRA_REPLICATION_FACTOR@g" "$cqlfile"
  while ! has_keyspace "$keyspace"; do
    /app/cqlsh < "$cqlfile" || sleep 20s
  done
  log "...done, schema definition is now ingested"
}

# wait for cassandra to start
while ! /app/cqlsh; do
  log "Cassandra not yet available, waiting..."
  sleep 10s
done
log "...done, Cassandra is now available"

# set up cassandra schema
if [ -n "$FORTIS_CASSANDRA_DATA_SCHEMA_URL" ]; then
  ingest_schema "$FORTIS_CASSANDRA_DATA_SCHEMA_URL" "fortis"
fi
if [ -n "$FORTIS_CASSANDRA_SETTINGS_SCHEMA_URL" ]; then
  ingest_schema "$FORTIS_CASSANDRA_SETTINGS_SCHEMA_URL" "settings"
fi

# set up users
if [ -n "$FORTIS_CASSANDRA_USERS" ]; then
  log "Got Fortis users, ingesting..."
  while ! npm run addusers -- 'user' "$FORTIS_CASSANDRA_USERS"; do sleep 20s; done
  log "...done, Fortis users are now ingested"
fi

# set up admins
if [ -n "$FORTIS_CASSANDRA_ADMINS" ]; then
  log "Got Fortis admins, ingesting..."
  while ! npm run addusers -- 'user' "$FORTIS_CASSANDRA_ADMINS"; do sleep 20s; done
  while ! npm run addusers -- 'admin' "$FORTIS_CASSANDRA_ADMINS"; do sleep 20s; done
  log "...done, Fortis admins are now ingested"
fi

# set up cassandra seed data
if [ -n "$FORTIS_CASSANDRA_SEED_DATA_URL" ]; then
  log "Got Fortis sample data at $FORTIS_CASSANDRA_SEED_DATA_URL, ingesting..."
  mkdir -p /tmp/cassandra-seed-data
  cd /tmp/cassandra-seed-data
  wget -qO- "$FORTIS_CASSANDRA_SEED_DATA_URL" | tar xzf -
  if [ -n "$FORTIS_CASSANDRA_SITE_NAME" ] && [ -f sitesettings.csv ]; then
    sed -i "s/Fortis Dev,/$FORTIS_CASSANDRA_SITE_NAME,/g" sitesettings.csv
  fi
  while ! has_seed_data; do
    /app/cqlsh < import.cql || sleep 20s
  done
  cd -
  log "...done, Fortis sample data is now ingested"
fi

# set up site entry
if [ -n "$FORTIS_CASSANDRA_SITE_NAME" ] && [ -n "$FORTIS_CASSANDRA_SITE_TYPE" ] && ! has_site; then
  log "Got Fortis site name and type, ingesting default site settings..."
  while ! npm run createsite -- "$FORTIS_CASSANDRA_SITE_NAME" "$FORTIS_CASSANDRA_SITE_TYPE"; do sleep 20s; done
  log "...done, Fortis default site is now ingested"
fi

# set up cognitive services secrets
if [ -n "$COGNITIVE_TRANSLATION_SERVICE_TOKEN" ]; then
  log "Got Fortis text translation cognitive services secrets, ingesting..."
  while ! npm run ingestsetting -- "translationSvcToken" "translationsvctoken" "$COGNITIVE_TRANSLATION_SERVICE_TOKEN"; do sleep 20s; done
  log "...done, Fortis text translation cognitive services secrets are now ingested"
fi
if [ -n "$COGNITIVE_SPEECH_SERVICE_TOKEN" ]; then
  log "Got Fortis speech transcription cognitive services secrets, ingesting..."
  while ! npm run ingestsetting -- "cogSpeechSvcToken" "cogspeechsvctoken" "$COGNITIVE_SPEECH_SERVICE_TOKEN"; do sleep 20s; done
  log "...done, Fortis speech transcription cognitive services secrets are now ingested"
fi
if [ -n "$COGNITIVE_VISION_SERVICE_TOKEN" ]; then
  log "Got Fortis image analysis cognitive services secrets, ingesting..."
  while ! npm run ingestsetting -- "cogVisionSvcToken" "cogvisionsvctoken" "$COGNITIVE_VISION_SERVICE_TOKEN"; do sleep 20s; done
  log "...done, Fortis image analysis cognitive services secrets are now ingested"
fi
if [ -n "$COGNITIVE_TEXT_SERVICE_TOKEN" ]; then
  log "Got Fortis text analytics cognitive services secrets, ingesting..."
  while ! npm run ingestsetting -- "cogTextSvcToken" "cogtextsvctoken" "$COGNITIVE_TEXT_SERVICE_TOKEN"; do sleep 20s; done
  log "...done, Fortis text analytics cognitive services secrets are now ingested"
fi

# set up mapbox credentials
if [ -n "$MAPBOX_ACCESS_TOKEN" ]; then
  log "Got MapBox token, ingesting..."
  while ! npm run ingestsetting -- "mapSvcToken" "mapsvctoken" "$MAPBOX_ACCESS_TOKEN"; do sleep 20s; done
  log "...done, MapBox token is now ingested"
fi

# wait for featureservice
while ! wget -qO- "$FORTIS_FEATURE_SERVICE_HOST/features/name/paris" > /dev/null; do
  log "featureService not yet available, waiting..."
  sleep 30s
done
log "...done, featureService is now available"

# start node server
while ! npm start; do sleep 20s; done
