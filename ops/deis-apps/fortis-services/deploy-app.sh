#!/usr/bin/env bash

cd project-fortis-services || exit -2

sudo git push deis master
deis scale web=3

cd ..