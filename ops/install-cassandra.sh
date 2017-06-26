#!/usr/bin/env bash

k8cassandra_node_count="$1"
storageClass="fast"

cd charts || exit -2
helm install --set replicaCount="${k8cassandra_node_count}" --set persistence.storageClass="${storageClass}" --name cassandra-cluster ./incubator/cassandra --namespace cassandra

cd ..
