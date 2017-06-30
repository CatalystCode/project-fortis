#!/usr/bin/env bash

readonly cassandra_host="$1"
readonly app_insights_id="$2"
readonly site_name="$3"
readonly feature_service_host="$4"
readonly SPARK_DAEMON_MEMORY="1g"
readonly spark_config_map_name="$5"
readonly graphql_service_host="$6"
readonly k8resource_group="$7"
readonly fortis_interface_host="$8"
readonly eh_conn_str="$9"
readonly default_language="en"
readonly checkpoint_directory="HDFS://"
readonly eh_path="published-messages"
readonly eh_consumer_group="\$Default"
readonly fortis_models_directory="https://fortiscentral.blob.core.windows.net/sentiment/"
readonly fortis_central_directory="https://fortiscentral.blob.core.windows.net/"

kubectl create configmap "${spark_config_map_name}" --namespace spark --from-literal=FORTIS_CASSANDRA_HOST="${cassandra_host}" --from-literal=FORTIS_FEATURE_SERVICE_HOST="${feature_service_host}" --from-literal=DEFAULT_SITE_NAME="${site_name}" --from-literal=FORTIS_APPINSIGHTS_IKEY="${app_insights_id}" --from-literal=SPARK_DAEMON_MEMORY="${SPARK_DAEMON_MEMORY}" --from-literal=HA_PROGRESS_DIR="${checkpoint_directory}" --from-literal=DEFAULT_LANGUAGE="${default_language}" --from-literal=FORTIS_SERVICE_HOST="${graphql_service_host}" --from-literal=FORTIS_MODELS_DIRECTORY="${fortis_models_directory}" --from-literal=PUBLISH_EVENTS_EVENTHUB_CONNECTION_STRING="${eh_conn_str}" --from-literal=PUBLISH_EVENTS_EVENTHUB_PATH="${eh_path}" --from-literal=PUBLISH_EVENTS_EVENTHUB_PARTITION="${eh_consumer_group}"

deis config:set APPINSIGHTS_INSTRUMENTATIONKEY="${app_insights_id}"
deis config:set FEATURE_SERVICE_HOST="${feature_service_host}"
deis config:set CASSANDRA_CONTACT_POINTS="${cassandra_host}"
deis config:set DEFAULT_SITE_NAME="${site_name}"
deis config:set FORTIS_SERVICE_HOST="${graphql_service_host}"
deis config:set FORTIS_CENTRAL_ASSETS_HOST="${fortis_central_directory}"
deis config:set PUBLISH_EVENTS_EVENTHUB_CONNECTION_STRING="${eh_conn_str}"
deis config:set PUBLISH_EVENTS_EVENTHUB_PATH="${eh_path}"
deis config:set PUBLISH_EVENTS_EVENTHUB_PARTITION="${eh_consumer_group}"

#Set the deployed service host url tag so we can output that on the deployment console to the user
az resource tag --tags FORTIS_SERVICE_HOST="${graphql_service_host}" -g "${k8resource_group}" -n k8deisstorage --resource-type "Microsoft.Storage/storageAccounts"
az resource tag --tags FORTIS_INTERFACE_HOST="${fortis_interface_host}" -g "${k8resource_group}" -n k8deisstorage --resource-type "Microsoft.Storage/storageAccounts"