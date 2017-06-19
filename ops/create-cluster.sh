#!/usr/bin/env bash

k8location="$1"
k8cassandra_node_count="$2"
k8spark_worker_count="$3"
k8resource_group="$4"
storage_account_name="$5"

chmod 752 -- *.sh

./create-disk.sh "${k8location}" "${storage_account_name}"
sleep 10

./install-deis.sh "${k8location}" "${k8resource_group}"

git clone https://github.com/CatalystCode/charts.git

./install-cassandra.sh "${k8cassandra_node_count}"
./install-spark.sh "${k8spark_worker_count}"
#./install-postgis
#./install-elasticsearch
#./install-kibana
