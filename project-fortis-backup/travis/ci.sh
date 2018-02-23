#!/usr/bin/env bash

set -e

pushd "$(dirname "$0")/.."

# shellcheck disable=SC2046
shellcheck $(find . -name '*.sh')

popd
