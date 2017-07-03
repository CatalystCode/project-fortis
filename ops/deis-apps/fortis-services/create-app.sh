#!/usr/bin/env bash

readonly fortis_service_gh_repo=https://github.com/CatalystCode/project-fortis-services.git

git clone ${fortis_service_gh_repo}

cd project-fortis-services || exit -2
deis create fortis-services
deis git:remote --force --remote deis --app fortis-services
deis domains:add fortis-services
#deis certs:attach fortis fortis-services
deis limits:set web=512M
deis autoscale:set web --min=2 --max=5 --cpu-percent=75

cd .. || exit -2