#!/usr/bin/env bash

k8location="$1"
k8resource_group="$2"

echo "creating deis storage account ${k8location}"
DEIS_STORAGE_ACCOUNT_NAME=k8deisstorage

sudo az storage account create -n "${DEIS_STORAGE_ACCOUNT_NAME}" -l "${k8location}" -g "${k8resource_group}" --sku Standard_LRS
DEIS_STORAGE_ACCOUNT_KEY="$(az storage account keys list -n "${DEIS_STORAGE_ACCOUNT_NAME}" -g "${k8resource_group}" --query [0].value --output tsv)"
export DEIS_STORAGE_ACCOUNT_KEY

echo "starting deis installation using helm"
helm repo add deis https://charts.deis.com/workflow
helm install deis/workflow --name deis --namespace=deis --set global.storage=azure,azure.accountname="${DEIS_STORAGE_ACCOUNT_NAME}",azure.accountkey="${DEIS_STORAGE_ACCOUNT_KEY}",azure.registry_container=registry,azure.database_container=database,azure.builder_container=builder
