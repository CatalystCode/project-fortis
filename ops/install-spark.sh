#!/usr/bin/env bash

k8spark_worker_count="$1"

cd charts || exit -2
sudo helm install --set Worker.Replicas="${k8spark_worker_count}" --name spark-cluster ./stable/spark --namespace spark
cd ..
