#!/usr/bin/env bash

set -e

pushd "$(dirname $0)/.."

if [ ! -d node_modules ]; then npm install; fi

npm run lint
npm run depcheck | grep 'No depcheck issue'

popd
