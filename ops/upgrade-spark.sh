#!/usr/bin/env bash

if ! (command -v jq >/dev/null); then sudo apt install jq; fi

readonly gh_fortis_spark_repo_name="project-fortis-spark"
readonly fortis_central_directory="$1"
readonly k8spark_worker_count="$2"
readonly ConfigMapName="$3"
readonly fortis_spark_version="${4:-$(curl "https://api.github.com/repos/catalystcode/${gh_fortis_spark_repo_name}/releases/latest" | jq -r '.tag_name')}"
readonly fortis_jar="fortis-${fortis_spark_version}.jar"
readonly SparkCommand="spark-submit --deploy-mode cluster --driver-memory 4g --supervise --master spark://spark-master:7077 --verbose --class com.microsoft.partnercatalyst.fortis.spark.ProjectFortis \"https://fortiscentral.blob.core.windows.net/jars/${fortis_jar}\""

cd charts || exit -2

helm upgrade --set Worker.Replicas="${k8spark_worker_count}" --set Master.ConfigMapName="${ConfigMapName}" --set Master.SparkSubmitCommand="${SparkCommand}" spark-cluster ./stable/spark --namespace spark

cd .. || exit -2
