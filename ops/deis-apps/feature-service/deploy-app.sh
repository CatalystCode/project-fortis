#!/usr/bin/env bash
export DEIS_PROFILE="/root/.deis/client.json"

cd featureService || exit -2

git push deis master
deis autoscale:set web --min=1 --max=3 --cpu-percent=75

cd .. || exit -2