#!/usr/bin/env bash

export DEIS_PROFILE="/root/.deis/client.json"

readonly cassandra_host="${1}"
readonly app_insights_id="${2}"
readonly site_name="${3}"
readonly feature_service_host="${4}"
readonly SPARK_DAEMON_MEMORY="1g"
readonly spark_config_map_name="${5}"
readonly graphql_service_host="${6}"
readonly k8resource_group="${7}"
readonly fortis_interface_host="${8}"
readonly eh_conn_str="${9}"
readonly fortis_central_directory="${10}"
readonly sb_conn_str="${11}"
readonly storage_account_name="${12}"

readonly fortis_admin_interface="http://${fortis_interface_host}/#/site/${site_name}/admin"
readonly default_language="en"
readonly checkpoint_directory="/opt/checkpoint"
readonly eh_path="published-messages"
readonly eh_consumer_group="\$Default"
readonly sb_queue_config="configuration"
readonly sb_queue_command="command"
readonly fortis_models_directory="${fortis_central_directory}/sentiment/"

kubectl create configmap "${spark_config_map_name}" --namespace spark \
--from-literal=FORTIS_CASSANDRA_HOST="${cassandra_host}" \
--from-literal=FORTIS_FEATURE_SERVICE_HOST="${feature_service_host}" \
--from-literal=DEFAULT_SITE_NAME="${site_name}" \
--from-literal=APPLICATION_INSIGHTS_IKEY="${app_insights_id}" \
--from-literal=SPARK_DAEMON_MEMORY="${SPARK_DAEMON_MEMORY}" \
--from-literal=DEFAULT_LANGUAGE="${default_language}" \
--from-literal=FORTIS_SERVICE_HOST="${graphql_service_host}" \
--from-literal=FORTIS_MODELS_DIRECTORY="${fortis_models_directory}" \
--from-literal=FORTIS_SB_CONN_STR="${sb_conn_str}" \
--from-literal=FORTIS_SB_CONFIG_QUEUE="${sb_queue_config}" \
--from-literal=FORTIS_SB_COMMAND_QUEUE="${sb_queue_command}" \
--from-literal=PUBLISH_EVENTS_EVENTHUB_CONNECTION_STRING="${eh_conn_str}" \
--from-literal=PUBLISH_EVENTS_EVENTHUB_PATH="${eh_path}" \
--from-literal=PUBLISH_EVENTS_EVENTHUB_PARTITION="${eh_consumer_group}"

cd deis-apps/fortis-services || exit 2

{
echo APPINSIGHTS_INSTRUMENTATIONKEY="${app_insights_id}"
echo FORTIS_FEATURE_SERVICE_HOST="${feature_service_host}"
echo CASSANDRA_CONTACT_POINTS="${cassandra_host}"
echo DEFAULT_SITE_NAME="${site_name}"
echo FORTIS_CENTRAL_ASSETS_HOST="${fortis_central_directory}"
echo PUBLISH_EVENTS_EVENTHUB_CONNECTION_STRING="${eh_conn_str}"
echo PUBLISH_EVENTS_EVENTHUB_PATH="${eh_path}"
echo PUBLISH_EVENTS_EVENTHUB_PARTITION="${eh_consumer_group}"
echo FORTIS_SB_CONFIG_QUEUE="${sb_queue_config}"
echo FORTIS_SB_COMMAND_QUEUE="${sb_queue_command}"
echo FORTIS_SB_CONN_STR="${sb_conn_str}"
echo CASSANDRA_USERNAME="cassandra"
echo CASSANDRA_PASSWORD="cassandra"
echo CASSANDRA_KEYSPACE="fortis"
echo ENABLE_V2=1
} >> .env

deis config:push

cd ../fortis-interface || exit 2

{
echo APPINSIGHTS_INSTRUMENTATIONKEY="${app_insights_id}"
echo REACT_APP_SERVICE_HOST="${graphql_service_host}"
echo DEFAULT_SITE_NAME="${site_name}"
} >> .env

deis config:push

cd ../../ || exit 2

#Set the deployed service host url tag so we can output that on the deployment console to the user
sudo az resource tag --tags FORTIS_INTERFACE_HOST="${fortis_interface_host}" FORTIS_ADMIN_INTERFACE_HOST="${fortis_admin_interface}" FORTIS_SERVICE_HOST="${graphql_service_host}" -g "${k8resource_group}" -n "${storage_account_name}" --resource-type "Microsoft.Storage/storageAccounts"
