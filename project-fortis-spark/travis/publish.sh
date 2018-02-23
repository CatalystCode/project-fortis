#!/usr/bin/env bash

set -euo pipefail

log() {
  echo "$@" >&2
}

check_preconditions() {
  if [ -z "${TRAVIS_TAG}" ]; then
    log "Build is not a tag, skipping publish"
    exit 0
  fi
  if [ -z "${DEPLOY_BLOB_ACCOUNT_NAME}" ] || [ -z "${DEPLOY_BLOB_ACCOUNT_KEY}" ] || [ -z "${DEPLOY_BLOB_CONTAINER}" ]; then
    log "Azure blob connection is not set, unable to publish builds"
    exit 1
  fi
}

install_azure_cli() {
  curl -sL 'https://deb.nodesource.com/setup_6.x' | sudo -E bash -
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
  --account-name "${DEPLOY_BLOB_ACCOUNT_NAME}" \
  --account-key "${DEPLOY_BLOB_ACCOUNT_KEY}" \
  --file "${fatjar}" \
  --container "${DEPLOY_BLOB_CONTAINER}" \
  --blob "fortis-${TRAVIS_TAG}.jar"
}

pushd "$(dirname $0)/.."

check_preconditions
install_azure_cli
create_fat_jar
publish_fat_jar

popd
