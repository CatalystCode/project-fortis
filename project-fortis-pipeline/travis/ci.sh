#!/usr/bin/env bash

pushd "$(dirname $0)/.."

shellcheck $(find . -name '*.sh')

popd
