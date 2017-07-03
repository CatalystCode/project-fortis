#!/usr/bin/env bash

cd project-fortis-services || exit -2
ssh-add ../deis_certs
git push deis master
deis autoscale:set web --min=2 --max=4 --cpu-percent=75

cd ..