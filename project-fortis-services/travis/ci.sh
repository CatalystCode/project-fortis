#!/usr/bin/env bash

set -e

pushd "$(dirname $0)/.."

if [ ! -d node_modules ]; then npm install; fi

npm run lint

popd
