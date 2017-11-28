#!/usr/bin/env bash

set -euo pipefail

readonly tag="${TRAVIS_TAG}"
readonly blobaccount="${DEPLOY_BLOB_ACCOUNT_NAME}"
readonly blobkey="${DEPLOY_BLOB_ACCOUNT_KEY}"
readonly blobcontainer="${DEPLOY_BLOB_CONTAINER}"
readonly blobname="fortis-${tag}.jar"

log() {
  echo "$@" >&2
}

check_preconditions() {
  if [ -z "${tag}" ]; then
    log "Build is not a tag, skipping publish"
    exit 0
  fi
  if [ -z "${blobaccount}" ] || [ -z "${blobkey}" ] || [ -z "${blobcontainer}" ]; then
    log "Azure blob connection is not set, unable to publish builds"
    exit 1
  fi
}

install_azure_cli() {
  curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
  sudo apt-get update
  sudo apt-get install -y -qq nodejs
  sudo npm install -g npm
  sudo npm install -g azure-cli
}

create_fat_jar() {
  sbt ++${TRAVIS_SCALA_VERSION} 'set test in assembly := {}' assembly
}

publish_fat_jar() {
  local fatjar="$(find target -name 'project-fortis-spark-assembly-*.jar' -print -quit)"
  if [ -z "${fatjar}" ] || [ ! -f "${fatjar}" ]; then
    log "Unable to locate fat jar"
    exit 1
  fi

  AZURE_NON_INTERACTIVE_MODE=1 \
  azure storage blob upload \
  --quiet \
  --account-name "${blobaccount}" \
  --account-key "${blobkey}" \
  --file "${fatjar}" \
  --container "${blobcontainer}" \
  --blob "${blobname}"
}

check_preconditions
install_azure_cli
create_fat_jar
publish_fat_jar
