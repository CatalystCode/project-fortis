#!/usr/bin/env bash

readonly k8cassandra_node_count="$1"
readonly agent_vm_size="$2"

# setup
cd charts || exit -2
readonly cluster_name="FORTIS_CASSANDRA"
readonly storageClass="fast"

# install cassandra
helm install \
  --set replicaCount="${k8cassandra_node_count}" \
  --set VmInstanceType="${agent_vm_size}" \
  --set cassandra.ClusterName="${cluster_name}" \
  --set persistence.storageClass="${storageClass}" \
  --namespace cassandra \
  --name cassandra-cluster \
  ./cassandra

# wait for all cassandra nodes to be ready
while [ -z "$(kubectl --namespace=cassandra get svc cassandra-cluster-cassan-ext -o jsonpath='{..ip}')" ]; do
  echo "Waiting for Cassandra to get ready"
  sleep 10s
done

# cleanup
cd ..
