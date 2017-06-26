#!/usr/bin/env bash

cassandra_host="$1"
app_insights_id="$2"
site_name="$3"
feature_service_host="$4"
SPARK_DAEMON_MEMORY="1g"
spark_config_map_name="$5"
graphql_service_host="$6"
default_language="en"
checkpoint_directory="HDFS://"
fortis_models_directory="https://fortiscentral.blob.core.windows.net/sentiment/"

kubectl create configmap "${spark_config_map_name}" --namespace spark --from-literal=FORTIS_CASSANDRA_HOST="${cassandra_host}" --from-literal=FORTIS_FEATURE_SERVICE_HOST="${feature_service_host}" --from-literal=DEFAULT_SITE_NAME="${site_name}" --from-literal=FORTIS_APPINSIGHTS_IKEY="${app_insights_id}" --from-literal=SPARK_DAEMON_MEMORY="${SPARK_DAEMON_MEMORY}" --from-literal=HA_PROGRESS_DIR="${checkpoint_directory}" --from-literal=DEFAULT_LANGUAGE="${default_language}" --from-literal=FORTIS_SERVICE_HOST="${graphql_service_host}" --from-literal=FORTIS_MODELS_DIRECTORY="${fortis_models_directory}"

deis config:set APPINSIGHTS_INSTRUMENTATIONKEY="${app_insights_id}"
deis config:set FEATURE_SERVICE_HOST="${feature_service_host}"
deis config:set CASSANDRA_SERVICE_HOST="${cassandra_host}"
deis config:set DEFAULT_SITE_NAME="${site_name}"
deis config:set FORTIS_SERVICE_HOST="${graphql_service_host}"