#!/usr/bin/env bash

cd project-fortis-services || exit -2
git push deis master
deis scale web=3