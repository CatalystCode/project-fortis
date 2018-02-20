#!/usr/bin/env bash

readonly cassandra_host="${1}"
readonly app_insights_id="${2}"
readonly site_name="${3}"
readonly feature_service_host="${4}"
readonly graphql_service_host="${5}"
readonly k8resource_group="${6}"
readonly fortis_interface_host="${7}"
readonly eh_conn_str="${8}"
readonly fortis_central_directory="${9}"
readonly sb_conn_str="${10}"
readonly storage_account_name="${11}"
readonly storage_account_key="${12}"
readonly eh_path="${13}"
readonly eh_consumer_group="${14}"
readonly sb_queue_config="${15}"
readonly sb_queue_command="${16}"
readonly checkpointfileshare="${17}"
readonly k8spark_worker_count="${18}"
readonly agent_vm_size="${19}"
readonly cogvisionsvctoken="${20}"
readonly cogspeechsvctoken="${21}"
readonly cogtextsvctoken="${22}"
readonly translationsvctoken="${23}"
readonly latest_version="${24}"
readonly cassandra_port="${25}"
readonly cassandra_username="${26}"
readonly cassandra_password="${27}"
readonly k8location="${28}"

# setup
cd charts || exit -2
readonly spark_daemon_memory="1g"
readonly default_language="en"
readonly checkpoint_directory="/opt/checkpoint"
readonly spark_config_map_name="spark-master-conf"
readonly spark_command="spark-submit --conf \"spark.executor.extraJavaOptions=-XX:+UseConcMarkSweepGC\" --conf \"spark.driver.extraJavaOptions=-XX:+UseConcMarkSweepGC\" --deploy-mode cluster --driver-memory 2g --executor-memory 18g --supervise --master spark://spark-master:7077 --verbose --class com.microsoft.partnercatalyst.fortis.spark.ProjectFortis \"https://fortiscentral.blob.core.windows.net/jars/fortis-${latest_version}.jar\""

readonly install_dir="$(mktemp -d /tmp/fortis-spark-XXXXXX)"
readonly namespace_yaml="${install_dir}/namespace.yaml"

# deploy the service to the kubernetes cluster
cat > "${namespace_yaml}" << EOF
{
  "kind": "Namespace",
  "apiVersion": "v1",
  "metadata": {
    "name": "spark",
    "labels": {
      "name": "spark"
    }
  }
}
EOF
kubectl create -f "${namespace_yaml}"
kubectl create configmap "${spark_config_map_name}" \
  --namespace spark \
  --from-literal=FORTIS_RESOURCE_GROUP_LOCATION="${k8location}" \
  --from-literal=FORTIS_CASSANDRA_HOST="${cassandra_host}" \
  --from-literal=FORTIS_CASSANDRA_PORT="${cassandra_port}" \
  --from-literal=FORTIS_CASSANDRA_USERNAME="${cassandra_username}" \
  --from-literal=FORTIS_CASSANDRA_PASSWORD="${cassandra_password}" \
  --from-literal=FORTIS_FEATURE_SERVICE_HOST="${feature_service_host}" \
  --from-literal=APPLICATION_INSIGHTS_IKEY="${app_insights_id}" \
  --from-literal=APPINSIGHTS_INSTRUMENTATIONKEY="${app_insights_id}" \
  --from-literal=SPARK_DAEMON_MEMORY="${spark_daemon_memory}" \
  --from-literal=DEFAULT_LANGUAGE="${default_language}" \
  --from-literal=FORTIS_SERVICE_HOST="${graphql_service_host}" \
  --from-literal=FORTIS_CENTRAL_ASSETS_HOST="${fortis_central_directory}" \
  --from-literal=FORTIS_SB_CONN_STR="${sb_conn_str}" \
  --from-literal=FORTIS_SB_CONFIG_QUEUE="${sb_queue_config}" \
  --from-literal=FORTIS_SB_COMMAND_QUEUE="${sb_queue_command}" \
  --from-literal=COGNITIVE_TEXT_SERVICE_TOKEN="${cogtextsvctoken}" \
  --from-literal=COGNITIVE_TRANSLATION_SERVICE_TOKEN="${translationsvctoken}" \
  --from-literal=COGNITIVE_SPEECH_SERVICE_TOKEN="${cogspeechsvctoken}" \
  --from-literal=COGNITIVE_VISION_SERVICE_TOKEN="${cogvisionsvctoken}" \
  --from-literal=PUBLISH_EVENTS_EVENTHUB_CONNECTION_STRING="${eh_conn_str}" \
  --from-literal=PUBLISH_EVENTS_EVENTHUB_PATH="${eh_path}" \
  --from-literal=PUBLISH_EVENTS_EVENTHUB_PARTITION="${eh_consumer_group}"

install_spark() {
  helm install \
    --set Worker.Replicas="${k8spark_worker_count}" \
    --set Master.ImageTag="2.2" \
    --set Worker.ImageTag="2.2" \
    --set Worker.ConfigMapName="${spark_config_map_name}" \
    --set Master.ConfigMapName="${spark_config_map_name}" \
    --set Master.SparkSubmitCommand="${spark_command}" \
    --set Worker.VmInstanceType="${agent_vm_size}" \
    --set Worker.Resources.Requests.Cpu="1" \
    --set Worker.Resources.Requests.Memory="10Gi" \
    --set Worker.Resources.Limits.Cpu="2.8" \
    --set Worker.Resources.Limits.Memory="20Gi" \
    --set Master.Resources.Requests.Cpu="1" \
    --set Master.Resources.Requests.Memory="3Gi" \
    --set Master.Resources.Limits.Cpu="2" \
    --set Master.Resources.Limits.Memory="5Gi" \
    --set Worker.Environment[0].name="SPARK_WORKER_MEMORY",Worker.Environment[0].value="20g" \
    --set Worker.Environment[1].name="SPARK_WORKER_OPTS",Worker.Environment[1].value="-Dspark.worker.cleanup.enabled=true -Dspark.worker.cleanup.interval=1800 -Dspark.worker.cleanup.appDataTtl=3600" \
    --namespace spark \
    --name spark-cluster \
    ./spark
}

while ! install_spark; do
  echo "Failed to set up spark helm chart, retrying"
  sleep 30s
done

# cleanup
cd ..
