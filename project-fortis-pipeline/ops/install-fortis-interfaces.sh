#!/usr/bin/env bash

readonly graphql_service_host="$1"
readonly feature_service_host="$2"
readonly blob_account_name="$3"
readonly blob_account_key="$4"
readonly blob_container_name="$5"
readonly fortis_interface_host="$6"

# setup
if ! (command -v jq >/dev/null); then sudo apt-get -qq install -y jq; fi
cp -r /tmp/project_fortis/project-fortis-interfaces /tmp/fortis-interfaces
pushd /tmp/fortis-interfaces

# add site root to package.json so that the frontend build can include the
# correct relative links to resources like js, css, static files, etc.
readonly package_json="$(mktemp)"
jq --arg homepage "$fortis_interface_host" ". + {homepage: \$homepage}" > "$package_json" < package.json
mv "$package_json" ./package.json

# build the frontend
REACT_APP_SERVICE_HOST="${graphql_service_host}" \
REACT_APP_FEATURE_SERVICE_HOST="${feature_service_host}" \
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
