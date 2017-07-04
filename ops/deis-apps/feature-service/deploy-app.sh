#!/usr/bin/env bash
export DEIS_PROFILE="/root/.deis/client.json"
eval "$(ssh-agent -s)"
ssh-add ./deis_certs
deis keys:add deis_certs.pub

cd featureService || exit -2

git push deis master
deis autoscale:set web --min=1 --max=3 --cpu-percent=75

cd .. || exit -2