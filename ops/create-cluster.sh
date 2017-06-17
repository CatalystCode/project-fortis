#!/usr/bin/env bash

k8location="$1"
k8cassandra_node_count="$2"
k8spark_worker_count="$3"
k8resource_group="$4"

chmod 752 -- *.sh

sudo ./create-disk.sh "${k8location}"
sudo ./install-deis.sh "${k8location}" "${k8resource_group}"

git clone https://github.com/CatalystCode/charts.git

sudo ./install-cassandra.sh "${k8cassandra_node_count}"
sudo ./install-spark.sh "${k8spark_worker_count}"
sudo ./install-postgis
#./install-elasticsearch
#./install-kibana