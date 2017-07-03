#!/usr/bin/env bash

readonly fortis_feature_svc_gh_repo=https://github.com/CatalystCode/featureService.git

git clone ${fortis_feature_svc_gh_repo}

cd featureService || exit -2

deis create feature-service
deis git:remote --force --remote deis --app feature-service
#deis certs:attach fortis fortis-services
deis limits:set web=512M
deis autoscale:set web --min=2 --max=4 --cpu-percent=75

cd .. || exit -2