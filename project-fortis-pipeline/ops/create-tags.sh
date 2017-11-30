#!/usr/bin/env bash

readonly k8resource_group="${1}"
readonly fortis_interface_host="${2}"
readonly site_name="${3}"
readonly graphql_service_host="${4}"

az group update --name "${k8resource_group}" --set tags.FORTIS_INTERFACE_URL="${fortis_interface_host}/index.html#/site/${site_name}"
az group update --name "${k8resource_group}" --set tags.FORTIS_ADMIN_INTERFACE_URL="${fortis_interface_host}/index.html#/site/${site_name}/admin"
az group update --name "${k8resource_group}" --set tags.FORTIS_SERVICE_HOST="${graphql_service_host}"
