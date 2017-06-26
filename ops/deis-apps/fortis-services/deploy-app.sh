#!/usr/bin/env bash

cd project-fortis-services || exit -2
deis git:remote --force --remote deis --app fortis-services

sudo git push deis master
deis scale web=3

cd ..