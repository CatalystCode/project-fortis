#!/usr/bin/env bash

export DEIS_PROFILE="/root/.deis/client.json"

git clone --depth=1 "https://github.com/CatalystCode/project-fortis-mono.git" fortis_services

cd fortis_services/project-fortis-services || exit -2

deis create fortis-services
deis git:remote --force --remote deis --app fortis-services
#deis certs:attach fortis fortis-services
deis limits:set web=512M
deis autoscale:set web --min=2 --max=5 --cpu-percent=75

cd ../.. || exit -2