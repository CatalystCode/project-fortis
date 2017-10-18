#!/usr/bin/env bash

readonly k8cassandra_node_count="$1"
readonly cluster_name="FORTIS_CASSANDRA"
readonly storageClass="fast"

cd charts || exit -2
helm install --set replicaCount="${k8cassandra_node_count}" --set cassandra.ClusterName="${cluster_name}" --set persistence.storageClass="${storageClass}" --name cassandra-cluster ./incubator/cassandra --namespace cassandra

cd ..
