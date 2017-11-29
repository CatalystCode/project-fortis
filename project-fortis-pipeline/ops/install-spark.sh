#!/usr/bin/env bash

if ! (command -v jq >/dev/null); then sudo apt-get install -y jq; fi

readonly k8spark_worker_count="$1"
readonly ConfigMapName="$2"
readonly fortis_central_directory="$3"
readonly storage_acct_name="$4"
readonly storage_acct_key="$5"
readonly checkpointfileshare="$6"
readonly latest_version=$(curl "https://api.github.com/repos/CatalystCode/project-fortis-mono/releases/latest" | jq -r '.tag_name')
readonly fortis_jar="fortis-${latest_version}.jar"
readonly SparkCommand="spark-submit --conf \"spark.executor.extraJavaOptions=-XX:+UseConcMarkSweepGC\" --conf \"spark.driver.extraJavaOptions=-XX:+UseConcMarkSweepGC\" --deploy-mode cluster --driver-memory 2g --executor-memory 18g --supervise --master spark://spark-master:7077 --verbose --class com.microsoft.partnercatalyst.fortis.spark.ProjectFortis \"https://fortiscentral.blob.core.windows.net/jars/${fortis_jar}\""

cd charts || exit -2
helm install --set Worker.Replicas="${k8spark_worker_count}" \
             --set Master.ImageTag="2.2" \
             --set Worker.ImageTag="2.2" \
             --set Worker.ConfigMapName="${ConfigMapName}" \
             --set Master.ConfigMapName="${ConfigMapName}" \
             --set Master.SparkSubmitCommand="${SparkCommand}" \
             --set Worker.Resources.Requests.Cpu="1" \
             --set Worker.Resources.Requests.Memory="10Gi" \
             --set Worker.Resources.Limits.Cpu="2.8" \
             --set Worker.Resources.Limits.Memory="20Gi" \
             --set Master.Resources.Requests.Cpu="1" \
             --set Master.Resources.Requests.Memory="3Gi" \
             --set Master.Resources.Limits.Cpu="2" \
             --set Master.Resources.Limits.Memory="5Gi" \
             --set Worker.Environment[0].name="SPARK_WORKER_MEMORY",Worker.Environment[0].value="20g" \
             --name spark-cluster ./stable/spark --namespace spark
cd ..
