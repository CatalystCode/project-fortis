#!/usr/bin/env bash

k8cassandra_node_count="$1"
cluster_name="FORTIS_CASSANDRA"
storageClass="fast"

cd charts || exit -2
helm install --set replicaCount="${k8cassandra_node_count}" --set cassandra.ClusterName="${cluster_name}" --set persistence.storageClass="${storageClass}" --name cassandra-cluster ./incubator/cassandra --namespace cassandra

cd ..
