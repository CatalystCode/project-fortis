#!/usr/bin/env bash

readonly k8location="$1"
readonly k8cassandra_node_count="$2"
readonly k8spark_worker_count="$3"
readonly k8resource_group="$4"
readonly storage_account_name="$5"
readonly app_insights_id="$6"
readonly site_name="$7"
readonly eh_conn_str="$8"
readonly sb_conn_str="$9"
readonly storage_account_key="${10}"
readonly checkpointfileshare="${11}"
<<<<<<< HEAD
readonly site_type="${12}"
=======
>>>>>>> Integrating azure file storage PVC mount to fortis deployment.

chmod -R 752 .

git clone https://github.com/CatalystCode/charts.git

echo "Installing Cassandra chart"
./install-cassandra.sh "${k8cassandra_node_count}"
echo "Finished. Now installing feature service DB"
# shellcheck disable=SC1091
. ./install-feature-service-db.sh "${k8location}" "${k8resource_group}"
echo "Finished. Now installing DEIS"
./install-deis.sh "${k8location}" "${k8resource_group}" "${storage_account_name}" "${storage_account_key}"
echo "Finished. Now installing DEIS fortis graphql service"
./deis-apps/fortis-services/create-app.sh
echo "Finished. Now deploying"
./deis-apps/fortis-services/deploy-app.sh
echo "Finished. Now installing DEIS fortis interface"
./deis-apps/fortis-interface/create-app.sh
echo "Finished. Now deploying"
./deis-apps/fortis-interface/deploy-app.sh
echo "Finished. Now installing DEIS feature service"
./deis-apps/feature-service/create-app.sh
echo "Finished. Now deploying"
./deis-apps/feature-service/deploy-app.sh

sleep 10
readonly max_retry_count=50
retries=0

while [[ -z ${cassandra_host} || -z ${DEIS_ROUTER_HOST_ROOT} ]]; do
   cassandra_host=$(kubectl --namespace=cassandra get svc cassandra-cluster-cassan-ext -o jsonpath='{.status.loadBalancer.ingress[*].ip}')

   DEIS_ROUTER_HOST_ROOT=$(kubectl --namespace=deis get svc deis-router -o jsonpath='{.status.loadBalancer.ingress[*].ip}')
   retries=$((retries+1))

   if [[ $retries -eq $max_retry_count ]]; then echo "FAILURE: Service host fetch retry count exceeded "; exit 1; fi

   sleep 3
done

readonly graphql_service_host="fortis-services.${DEIS_ROUTER_HOST_ROOT}.nip.io"
readonly fortis_interface_host="fortis-interface.${DEIS_ROUTER_HOST_ROOT}.nip.io"
readonly feature_service_db_conn_str="${FEATURE_SERVICE_DB_CONNECTION_STRING}"
readonly feature_service_host="http://feature-service.${DEIS_ROUTER_HOST_ROOT}.nip.io"
readonly fortis_central_directory="https://fortiscentral.blob.core.windows.net/"
readonly spark_config_map_name="spark-master-conf"

echo "Finished. Now setting up site entry"
./create-site.sh "${graphql_service_host}" "${site_name}" "${site_type}"

echo "Finished. Installing cassandra cqlsh cli."
./storage-ddls/install-cassandra-ddls.sh "${cassandra_host}"
kubectl create -f ./spark-namespace.yaml
echo "Finished. Deploying environment settings to cluster."
./setup-environment.sh \
    "${cassandra_host}" \
    "${app_insights_id}" \
    "${site_name}" \
    "${feature_service_host}" \
    "${spark_config_map_name}" \
    "${graphql_service_host}" \
    "${k8resource_group}" \
    "${fortis_interface_host}" \
    "${eh_conn_str}" \
    "${feature_service_db_conn_str}" \
    "${fortis_central_directory}" \
    "${sb_conn_str}" \
    "${storage_account_name}"

echo "Finished. Installing spark cluster."
./install-spark.sh "${k8spark_worker_count}" "${spark_config_map_name}" "${fortis_central_directory}" "${storage_account_name}" "${storage_account_key}" "${checkpointfileshare}"

#./install-elasticsearch
#./install-kibana
