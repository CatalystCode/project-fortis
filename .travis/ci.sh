#!/usr/bin/env bash

set -euo pipefail

sbt ++${TRAVIS_SCALA_VERSION} test
