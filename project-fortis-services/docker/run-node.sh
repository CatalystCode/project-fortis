#!/usr/bin/env sh

has_cassandra_schema() {
  echo 'DESCRIBE KEYSPACES;' | /app/cqlsh | grep -q 'fortis'
}

has_seed_data() {
  echo 'SELECT * FROM fortis.sitesettings;' | /app/cqlsh | grep -q '(1 rows)'
}

has_site() {
  echo 'SELECT sitename FROM fortis.sitesettings;' | /app/cqlsh | grep -q "$FORTIS_CASSANDRA_SITE_NAME"
}

# wait for cassandra to start
while ! /app/cqlsh; do
  echo "Cassandra not yet available, waiting..."
  sleep 10s
done
echo "...done, Cassandra is now available"

# set up cassandra schema
if [ -n "$FORTIS_CASSANDRA_SCHEMA_URL" ]; then
  echo "Got Fortis schema definition at $FORTIS_CASSANDRA_SCHEMA_URL, ingesting..."
  mkdir -p /tmp/cassandra-schema
  cd /tmp/cassandra-schema
  wget -qO- "$FORTIS_CASSANDRA_SCHEMA_URL" > setup.cql
  sed -i "s@'replication_factor' *: *[0-9]\+@'replication_factor': $FORTIS_CASSANDRA_REPLICATION_FACTOR@g" setup.cql
  while ! has_cassandra_schema; do
    /app/cqlsh < setup.cql || sleep 20s
  done
  cd -
  echo "...done, Fortis schema definition is now ingested"
fi

# set up users
if [ -n "$FORTIS_CASSANDRA_USERS" ]; then
  echo "Got Fortis users, ingesting..."
  while ! npm run addusers -- 'user' "$FORTIS_CASSANDRA_USERS"; do sleep 20s; done
  echo "...done, Fortis users are now ingested"
fi

# set up admins
if [ -n "$FORTIS_CASSANDRA_ADMINS" ]; then
  echo "Got Fortis admins, ingesting..."
  while ! npm run addusers -- 'user' "$FORTIS_CASSANDRA_ADMINS"; do sleep 20s; done
  while ! npm run addusers -- 'admin' "$FORTIS_CASSANDRA_ADMINS"; do sleep 20s; done
  echo "...done, Fortis admins are now ingested"
fi

# set up cassandra seed data
if [ -n "$FORTIS_CASSANDRA_SEED_DATA_URL" ]; then
  echo "Got Fortis sample data at $FORTIS_CASSANDRA_SEED_DATA_URL, ingesting..."
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
  echo "...done, Fortis sample data is now ingested"
fi

# set up site entry
if [ -n "$FORTIS_CASSANDRA_SITE_NAME" ] && [ -n "$FORTIS_CASSANDRA_SITE_TYPE" ] && ! has_site; then
  echo "Got Fortis site name and type, ingesting default site settings..."
  while ! npm run createsite -- "$FORTIS_CASSANDRA_SITE_NAME" "$FORTIS_CASSANDRA_SITE_TYPE"; do sleep 20s; done
  echo "...done, Fortis default site is now ingested"
fi

# set up cognitive services secrets
if [ -n "$COGNITIVE_TRANSLATION_SERVICE_TOKEN" ]; then
  echo "Got Fortis text translation cognitive services secrets, ingesting..."
  while ! npm run ingestsetting -- "translationSvcToken" "translationsvctoken" "$COGNITIVE_TRANSLATION_SERVICE_TOKEN"; do sleep 20s; done
  echo "...done, Fortis text translation cognitive services secrets are now ingested"
fi
if [ -n "$COGNITIVE_SPEECH_SERVICE_TOKEN" ]; then
  echo "Got Fortis speech transcription cognitive services secrets, ingesting..."
  while ! npm run ingestsetting -- "cogSpeechSvcToken" "cogspeechsvctoken" "$COGNITIVE_SPEECH_SERVICE_TOKEN"; do sleep 20s; done
  echo "...done, Fortis speech transcription cognitive services secrets are now ingested"
fi
if [ -n "$COGNITIVE_VISION_SERVICE_TOKEN" ]; then
  echo "Got Fortis image analysis cognitive services secrets, ingesting..."
  while ! npm run ingestsetting -- "cogVisionSvcToken" "cogvisionsvctoken" "$COGNITIVE_VISION_SERVICE_TOKEN"; do sleep 20s; done
  echo "...done, Fortis image analysis cognitive services secrets are now ingested"
fi
if [ -n "$COGNITIVE_TEXT_SERVICE_TOKEN" ]; then
  echo "Got Fortis text analytics cognitive services secrets, ingesting..."
  while ! npm run ingestsetting -- "cogTextSvcToken" "cogtextsvctoken" "$COGNITIVE_TEXT_SERVICE_TOKEN"; do sleep 20s; done
  echo "...done, Fortis text analytics cognitive services secrets are now ingested"
fi

# set up mapbox credentials
if [ -n "$MAPBOX_ACCESS_TOKEN" ]; then
  echo "Got MapBox token, ingesting..."
  while ! npm run ingestsetting -- "mapSvcToken" "mapsvctoken" "$MAPBOX_ACCESS_TOKEN"; do sleep 20s; done
  echo "...done, MapBox token is now ingested"
fi

# start node server
while ! npm start; do sleep 20s; done
