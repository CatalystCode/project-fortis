#!/usr/bin/env bash

curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
export DEIS_PROFILE="/root/.deis/client.json"

git clone --depth=1 "https://github.com/CatalystCode/project-fortis-mono.git" /tmp/fortis_interface

mv /tmp/fortis_interface/project-fortis-interfaces /opt/fortis-interface
rm -rf /tmp/fortis_interface

pushd /opt/fortis-interface
git init
git add -A
git commit -m "Initial commit"

deis create fortis-interface
deis git:remote --force --remote deis --app fortis-interface
#deis certs:attach fortis fortis-services
deis limits:set web=512M

popd