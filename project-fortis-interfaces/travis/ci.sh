#!/usr/bin/env bash

pushd "$(dirname $0)/.."

npm install
npm run lint

popd
