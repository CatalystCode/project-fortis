#!/usr/bin/env bash

k8location="$1"
k8cassandra_node_count="$2"
k8spark_worker_count="$3"
k8resource_group="$4"
storage_account_name="$5"
cluster_prefix="$5"
app_insights_id="$6"
site_name="$7"

chmod 752 -- *.sh

./create-disk.sh "${k8location}" "${storage_account_name}"
sleep 10

git clone https://github.com/CatalystCode/charts.git

./install-cassandra.sh "${k8cassandra_node_count}"
./install-deis.sh "${k8location}" "${k8resource_group}" "${cluster_prefix}" "${ssh_key}"

sleep 10
max_retry_count=50
retries=0

while [[ -z ${cassandra_host} || -z ${DEIS_ROUTER_HOST_ROOT} ]]; do
   cassandra_host=$(kubectl --namespace=cassandra get svc cassandra-cassandra-ext -o jsonpath='{.status.loadBalancer.ingress[*].ip}')

   DEIS_ROUTER_HOST_ROOT=$(kubectl --namespace=deis get svc deis-router -o jsonpath='{.status.loadBalancer.ingress[*].ip}')
   retries=$((retries+1))

   if [[ $retries -eq $max_retry_count ]]; then echo "FAILURE: Service host fetch retry count exceeded "; exit 1; fi
done

graphql_service_host="fortis-services.${DEIS_ROUTER_HOST_ROOT}.nio.io"
feature_service_host=1.1.1.1
spark_config_map_name="spark-master-conf"

chmod 752 ./storage-ddls/*.sh

./storage-ddls/install-cassandra-ddls.sh "${cassandra_host}"
./setup-environment.sh "${cassandra_host}" "${app_insights_id}" "${site_name}" "${feature_service_host}" "${spark_config_map_name}" "${graphql_service_host}"
./install-spark.sh "${k8spark_worker_count}" "${spark_config_map_name}"

#./install-postgis
#./install-elasticsearch
#./install-kibana
