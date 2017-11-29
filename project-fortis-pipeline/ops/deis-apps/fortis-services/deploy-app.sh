#!/usr/bin/env bash

export DEIS_PROFILE="/root/.deis/client.json"
eval "$(ssh-agent -s)"
ssh-add ./deis_certs
deis keys:add deis_certs.pub

pushd project-fortis-services

git push deis master
deis autoscale:set web --min=2 --max=4 --cpu-percent=75

popd