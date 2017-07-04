#!/usr/bin/env bash

cd project-fortis-services || exit -2
git push deis master
deis autoscale:set web --min=2 --max=4 --cpu-percent=75

cd .. || exit -2