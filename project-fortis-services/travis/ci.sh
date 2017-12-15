#!/usr/bin/env bash

set -e

pushd "$(dirname $0)/.."

npm install
npm run lint

popd
