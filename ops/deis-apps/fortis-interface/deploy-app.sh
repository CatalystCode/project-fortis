#!/usr/bin/env bash

export DEIS_PROFILE="/root/.deis/client.json"
eval "$(ssh-agent -s)"
ssh-add ./deis_certs

readonly CUSTOM_REACT_CREATE_APP_BP="https://github.com/heroku/heroku-buildpack-static.git"
cd project-fortis-interfaces || exit -2

deis config:set BUILDPACK_URL=${CUSTOM_REACT_CREATE_APP_BP}
npm install
npm run build
mv build webdeploy
echo '{"root": "webdeploy/"}' > static.json
git add -A
git commit -m "Adding deployment assets"
git push deis master
deis autoscale:set web --min=2 --max=5 --cpu-percent=75

cd .. || exit -2