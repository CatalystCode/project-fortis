#!/usr/bin/env bash

k8location="$1"
k8resource_group="$2"

curl -sSL http://deis.io/deis-cli/install-v2.sh | bash
sudo ln -fs "${PWD}/deis" /usr/local/bin/deis

echo "creating deis storage account ${k8location}"
DEIS_STORAGE_ACCOUNT_NAME=k8deisstorage

sudo az storage account create -n "${DEIS_STORAGE_ACCOUNT_NAME}" -l "${k8location}" -g "${k8resource_group}" --sku Standard_LRS
DEIS_STORAGE_ACCOUNT_KEY="$(az storage account keys list -n "${DEIS_STORAGE_ACCOUNT_NAME}" -g "${k8resource_group}" --query [0].value --output tsv)"
export DEIS_STORAGE_ACCOUNT_KEY

echo "starting deis installation using helm"
helm repo add deis https://charts.deis.com/workflow

echo "Installing Deis on Cluster"

helm install deis/workflow --name deis --namespace=deis --set global.storage=azure,azure.accountname="${DEIS_STORAGE_ACCOUNT_NAME}",azure.accountkey="${DEIS_STORAGE_ACCOUNT_KEY}",azure.registry_container=registry,azure.database_container=database,azure.builder_container=builder

while [[ -z ${DEIS_ROUTER_HOST_ROOT} ]]; do
   DEIS_ROUTER_HOST_ROOT=$(kubectl --namespace=deis get svc deis-router -o jsonpath='{.status.loadBalancer.ingress[*].ip}')
   sleep 3
done

DEIS_HOSTNAME_URL="http://deis.${DEIS_ROUTER_HOST_ROOT}.nip.io"
DEIS_BUILDER_HOSTNAME="deis-builder.${DEIS_ROUTER_HOST_ROOT}.nip.io"
echo "Registering Deis Load Balancer"
deis register "${DEIS_HOSTNAME_URL}" --username=deis-admin --login=true --password=test --email=newuser@deis.io

echo "Adding deis public key"
ssh-keygen -t rsa -N "" -f "./deis_certs" -V "+365d"
eval "$(ssh-agent -s)" && ssh-add ./deis_certs && ssh-keyscan -t rsa -p 2222 "${DEIS_BUILDER_HOSTNAME}" >> ~/.ssh/known_hosts
deis keys:add deis_certs.pub
deis keys:list

#openssl genrsa -des3 -passout pass:x -out server.pass.key 2048
#openssl rsa -passin pass:x -in server.pass.key -out server.key
#openssl req -new -key server.key -out server.csr
#openssl x509 -req -sha256 -days 365 -in server.csr -signkey server.key -out server.crt
#deis certs:add fortis server.crt server.key