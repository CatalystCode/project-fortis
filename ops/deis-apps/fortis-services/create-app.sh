#!/usr/bin/env bash

readonly fortis_service_gh_repo=https://github.com/CatalystCode/project-fortis-services.git

git clone ${fortis_service_gh_repo}

deis create fortis-services
#deis git:remote --force --remote deis --app fortis-services
#deis domains:add fortis-services
#deis certs:attach fortis fortis-services
#deis limits:set web=512M