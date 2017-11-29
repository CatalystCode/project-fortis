#!/usr/bin/env bash

export DEIS_PROFILE="/root/.deis/client.json"

git clone --depth=1 "https://github.com/CatalystCode/project-fortis-mono.git" /tmp/fortis_services

mv /tmp/fortis_services/project-fortis-services .
rm -rf /tmp/fortis_services

pushd project-fortis-services
git init
git add -A
git commit -m "Initial commit"

deis create fortis-services
deis git:remote --force --remote deis --app fortis-services
#deis certs:attach fortis fortis-services
deis limits:set web=512M
deis autoscale:set web --min=2 --max=5 --cpu-percent=75

popd