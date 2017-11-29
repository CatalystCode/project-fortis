#!/usr/bin/env bash

export DEIS_PROFILE="/root/.deis/client.json"

git clone "https://github.com/CatalystCode/featureService.git" feature_service

cd feature_service || exit -2

echo "DEIS_PROFILE: ${DEIS_PROFILE}"
deis create feature-service
deis git:remote --force --remote deis --app feature-service
#deis certs:attach fortis fortis-services
deis limits:set web=512M
deis autoscale:set web --min=2 --max=4 --cpu-percent=75

cd .. || exit -2