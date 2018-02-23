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
  if [ -z "${DOCKER_USERNAME}" ] || [ -z "${DOCKER_PASSWORD}" ]; then
    log "Docker credentials not provided, unable to publish builds"
    exit 1
  fi
}

create_image() {
  touch .env-secrets
  BUILD_TAG="${TRAVIS_TAG}" docker-compose build project_fortis_backup
}

publish_image() {
  docker login --username="${DOCKER_USERNAME}" --password="${DOCKER_PASSWORD}"
  BUILD_TAG="${TRAVIS_TAG}" docker-compose push project_fortis_backup
}

pushd "$(dirname "$0")/../.."

check_preconditions
create_image
publish_image

popd
