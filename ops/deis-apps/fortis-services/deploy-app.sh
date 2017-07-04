#!/usr/bin/env bash

export DEIS_PROFILE="/root/.deis/client.json"

cd project-fortis-services || exit -2
git push deis master
deis autoscale:set web --min=2 --max=4 --cpu-percent=75

cd .. || exit -2