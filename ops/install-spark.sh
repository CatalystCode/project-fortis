#!/usr/bin/env bash

readonly k8spark_worker_count="$1"
readonly ConfigMapName="$2"

cd charts || exit -2
helm install --set Worker.Replicas="${k8spark_worker_count}" --set Master.ConfigMapName="${ConfigMapName}" --name spark-cluster ./stable/spark --namespace spark
cd ..
