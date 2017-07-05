#!/usr/bin/env bash

sudo apt install jq

readonly k8spark_worker_count="$1"
readonly ConfigMapName="$2"
readonly fortis_central_directory="$3"
readonly gh_fortis_spark_repo_name="project-fortis-spark"
readonly latest_version=$(curl "https://api.github.com/repos/catalystcode/${gh_fortis_spark_repo_name}/releases/latest" | jq -r '.tag_name')
readonly SparkCommand="['spark-submit', '--driver-memory', '4g', '${fortis_central_directory}/jars/fortis-${latest_version}.jar']"

cd charts || exit -2
helm install --set Worker.Replicas="${k8spark_worker_count}" --set Master.ConfigMapName="${ConfigMapName}" --set Master.SparkSubmitCommand="${SparkCommand}" --name spark-cluster ./stable/spark --namespace spark
cd ..
