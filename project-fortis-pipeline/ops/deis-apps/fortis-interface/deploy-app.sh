#!/usr/bin/env bash

export KUBECONFIG=/home/fortisadmin/.kube/config
export HELM_HOME=/home/fortisadmin/
export DEIS_PROFILE="/root/.deis/client.json"
eval "$(ssh-agent -s)"
ssh-add ./deis_certs

DEIS_ROUTER_HOST_ROOT=$(kubectl --namespace=deis get svc deis-router -o jsonpath='{.status.loadBalancer.ingress[*].ip}')
readonly graphql_service_host="http://fortis-services.${DEIS_ROUTER_HOST_ROOT}.nip.io"
readonly CUSTOM_REACT_CREATE_APP_BP="https://github.com/heroku/heroku-buildpack-static.git"
readonly feature_service_host="http://fortis-features.eastus.cloudapp.azure.com"
export REACT_APP_SERVICE_HOST="${graphql_service_host}"
export REACT_APP_FEATURE_SERVICE_HOST="${feature_service_host}"

cd project-fortis-interfaces || exit -2
git pull origin master
rm -rf webdeploy

deis config:set BUILDPACK_URL=${CUSTOM_REACT_CREATE_APP_BP}
npm install
npm run build
mv build webdeploy
echo '{"root": "webdeploy/"}' > static.json
git add -A
git commit -m "Adding deployment assets"
git push deis master
deis autoscale:set web --min=2 --max=5 --cpu-percent=75

cd .. || exit -2