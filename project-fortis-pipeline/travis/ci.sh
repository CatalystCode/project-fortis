#!/usr/bin/env bash

# shellcheck disable=SC2086
pushd "$(dirname $0)/.."

# shellcheck disable=SC2046
shellcheck $(find . -name '*.sh')

popd
