#!/usr/bin/env bash

readonly fortis_interface_gh_repo=https://github.com/CatalystCode/project-fortis-interfaces
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs

git clone ${fortis_interface_gh_repo}

cd project-fortis-interfaces || exit -2

deis create fortis-interface
deis git:remote --force --remote deis --app fortis-interface
#deis certs:attach fortis fortis-services
deis limits:set web=512M

cd .. || exit -2