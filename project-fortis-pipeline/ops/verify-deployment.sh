#!/usr/bin/env bash

readonly graphql_service_host="$1"

if ! (command -v jq >/dev/null); then sudo apt-get -qq install -y jq; fi

readonly cassandraOk="$(curl -s "${graphql_service_host}/healthcheck" | jq -r '.cassandraIsInitialized')"
if [ "${cassandraOk}" != "true" ]; then
  echo "Cassandra did not come up" >&2
  exit 1
fi
