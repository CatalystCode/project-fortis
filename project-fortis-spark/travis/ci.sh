#!/usr/bin/env bash

pushd "$(dirname $0)/.."

sbt ++${TRAVIS_SCALA_VERSION} test

popd
