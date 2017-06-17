#!/usr/bin/env bash

cd charts
sudo helm install --set Worker.Replicas=${k8spark_worker_count} --name spark-cluster ./stable/spark --namespace spark
cd ..