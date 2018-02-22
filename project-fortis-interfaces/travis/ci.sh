#!/usr/bin/env bash

set -e

pushd "$(dirname $0)/.."

err=0

if [ ! -d node_modules ]; then
  npm install
fi

if ! npm run lint; then
  err=1
fi

if npm run depcheck | grep -q '^Unused dependencies$'; then
  err=2
fi

popd

exit "$err"
