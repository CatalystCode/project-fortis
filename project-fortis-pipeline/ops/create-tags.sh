#!/usr/bin/env bash

readonly k8resource_group="${1}"
readonly fortis_interface_host="${2}"
readonly site_name="${3}"
readonly graphql_service_host="${4}"
readonly dns_host_name="${5}"
readonly dns_host_ip="${6}"
readonly mx_record_entry="${7}"

az group update --name "${k8resource_group}" --set tags.FORTIS_INTERFACE_URL="${fortis_interface_host}/index.html#/site/${site_name}"
az group update --name "${k8resource_group}" --set tags.FORTIS_ADMIN_INTERFACE_URL="${fortis_interface_host}/index.html#/site/${site_name}/admin"
az group update --name "${k8resource_group}" --set tags.FORTIS_AAD_REDIRECT_URL="${fortis_interface_host}/index.html"
az group update --name "${k8resource_group}" --set tags.FORTIS_SERVICE_HOST="${graphql_service_host}"

if [ -n "${dns_host_name}" ]; then
  az group update --name "${k8resource_group}" --set tags.FORTIS_DNS_NAME="${dns_host_name}"
  az group update --name "${k8resource_group}" --set tags.FORTIS_DNS_IP="${dns_host_ip}"
fi

if [ -n "${mx_record_entry}" ]; then
  # note: the space in front of the tag value is intentional as the `az` command otherwise
  #       interprets the value following (if it has an @ at the beginning) as a filename
  az group update --name "${k8resource_group}" --set tags.FORTIS_MX_RECORD=" ${mx_record_entry}"
fi
