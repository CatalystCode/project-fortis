#!/usr/bin/env bash

set -e

pushd "$(dirname $0)/.."

err=0

npm install

if ! ./node_modules/.bin/eslint --max-warnings=0 src *.js; then
  err=1
fi

if ./node_modules/.bin/depcheck | grep -q '^Unused dependencies$'; then
  err=2
fi

popd

exit "$err"
