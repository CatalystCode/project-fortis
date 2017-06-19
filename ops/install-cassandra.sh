#!/usr/bin/env bash

k8cassandra_node_count="$1"

cd charts || exit -2
helm install --set replicaCount="${k8cassandra_node_count}" --name cassandra-cluster ./incubator/cassandra --namespace cassandra

cd ..
