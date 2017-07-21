#!/usr/bin/env bash

if ! (command -v jq >/dev/null); then sudo apt install jq; fi

readonly k8spark_worker_count="$1"
readonly ConfigMapName="$2"
readonly fortis_central_directory="$3"
readonly gh_fortis_spark_repo_name="project-fortis-spark"
readonly latest_version=$(curl "https://api.github.com/repos/catalystcode/${gh_fortis_spark_repo_name}/releases/latest" | jq -r '.tag_name')
readonly fortis_jar="fortis-${latest_version}.jar"
readonly SparkCommand="spark-submit --deploy-mode cluster --driver-memory 4g --supervise --master spark://spark-master:7077 --verbose --class com.microsoft.partnercatalyst.fortis.spark.ProjectFortis \"https://fortiscentral.blob.core.windows.net/jars/${fortis_jar}\""

cd charts || exit -2
helm install --set Worker.Replicas="${k8spark_worker_count}" --set Master.ConfigMapName="${ConfigMapName}" --set Master.SparkSubmitCommand="${SparkCommand}" --name spark-cluster ./stable/spark --namespace spark
cd ..
