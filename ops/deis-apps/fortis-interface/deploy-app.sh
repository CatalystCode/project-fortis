#!/usr/bin/env bash

readonly CUSTOM_REACT_CREATE_APP_BP="https://github.com/mars/create-react-app-buildpack.git"
cd project-fortis-interfaces || exit -2

deis config:set BUILDPACK_URL=${CUSTOM_REACT_CREATE_APP_BP}
deis git:remote --force --remote deis --app fortis-interface

sudo git push deis master
deis scale web=3

cd ..