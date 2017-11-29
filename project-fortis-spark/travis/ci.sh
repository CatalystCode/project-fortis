#!/usr/bin/env bash

set -e

pushd "$(dirname $0)/.."

sbt ++${TRAVIS_SCALA_VERSION} test

popd
