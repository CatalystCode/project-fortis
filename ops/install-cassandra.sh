#!/usr/bin/env bash

readonly k8cassandra_node_count="$1"
readonly agent_vm_size="$2"
readonly cluster_name="FORTIS_CASSANDRA"
readonly storageClass="fast"

cd charts || exit -2

helm install \
  --set replicaCount="${k8cassandra_node_count}" \
  --set VmInstanceType="${agent_vm_size}" \
  --set cassandra.ClusterName="${cluster_name}" \
  --set persistence.storageClass="${storageClass}" \
  --name cassandra-cluster ./incubator/cassandra \
  --namespace cassandra

cd ..
