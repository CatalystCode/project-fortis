#!/usr/bin/env bash

readonly graphql_service_host="$1"
readonly feature_service_host="$2"
readonly blob_account_name="$3"
readonly blob_account_key="$4"
readonly blob_container_name="$5"
readonly fortis_interface_host="$6"
readonly aad_client="$7"

# setup
if ! (command -v jq >/dev/null); then sudo apt-get -qq install -y jq; fi
if ! (command -v npm >/dev/null); then curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -; sudo apt-get -qq install -y nodejs; fi
cp -r /tmp/fortis-project/project-fortis-interfaces /tmp/fortis-interfaces
pushd /tmp/fortis-interfaces
npm install

# add site root to package.json so that the frontend build can include the
# correct relative links to resources like js, css, static files, etc.
readonly package_json="$(mktemp)"
jq --arg homepage "$fortis_interface_host" ". + {homepage: \$homepage}" > "$package_json" < package.json
mv "$package_json" ./package.json

# build the frontend
# TODO: don't hard code the mapbox credentials
REACT_APP_SERVICE_HOST="${graphql_service_host}" \
REACT_APP_FEATURE_SERVICE_HOST="${feature_service_host}" \
REACT_APP_AD_CLIENT_ID="${aad_client}" \
REACT_APP_MAPBOX_ACCESS_TOKEN="pk.eyJ1IjoiZXJpa3NjaGxlZ2VsIiwiYSI6ImNpaHAyeTZpNjAxYzd0c200dWp4NHA2d3AifQ.5bnQcI_rqBNH0rBO0pT2yg" \
REACT_APP_MAPBOX_TILE_LAYER_URL="https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/256/{z}/{x}/{y}" \
npm run build

# deploy the frontend to blob storage
az storage container create \
  --account-key "$blob_account_key" \
  --account-name "$blob_account_name" \
  --name "$blob_container_name" \
  --public-access "container"
az storage blob upload-batch \
  --account-key "$blob_account_key" \
  --account-name "$blob_account_name" \
  --destination "$blob_container_name" \
  --source "./build"

# cleanup
popd
