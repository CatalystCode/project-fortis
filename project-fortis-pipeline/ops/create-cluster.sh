#!/usr/bin/env bash

readonly k8location="$1"
readonly k8cassandra_node_count="$2"
readonly k8spark_worker_count="$3"
readonly k8resource_group="$4"
readonly storage_account_name="$5"
readonly app_insights_id="$6"
readonly site_name="$7"
readonly eh_conn_str="$8"
readonly sb_conn_str="$9"
readonly storage_account_key="${10}"
readonly checkpointfileshare="${11}"
readonly site_type="${12}"
readonly agent_vm_size="${13}"
readonly fortis_admins="${14}"
readonly fortis_users="${15}"
readonly aad_client="${16}"
readonly mapbox_access_token="${17}"

readonly feature_service_host="http://fortis-features.eastus.cloudapp.azure.com"
readonly fortis_central_directory="https://fortiscentral.blob.core.windows.net/"
readonly fortis_interface_container="public"
readonly fortis_interface_host="http://${storage_account_name}.blob.core.windows.net/${fortis_interface_container}"
readonly eh_path="published-messages"
readonly eh_consumer_group="\$Default"
readonly sb_queue_config="configuration"
readonly sb_queue_command="command"
readonly mapbox_tile_layer_url="https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/256/{z}/{x}/{y}"

chmod -R 752 .

echo "Waiting for Tiller pod to get ready"
while ! (kubectl get po --namespace kube-system | grep -i 'tiller' | grep -i 'running' | grep -i '1/1'); do echo "Waiting for Tiller pod"; sleep 10s; done

echo "Finished. Now installing Cassandra helm chart."
./install-cassandra.sh "${k8cassandra_node_count}" "${agent_vm_size}"
while :; do
   cassandra_ip="$(kubectl --namespace=cassandra get svc cassandra-cluster-cassan-ext -o jsonpath='{..clusterIP}')"
   if [ -n "${cassandra_ip}" ]; then break; else echo "Waiting for Cassandra IP"; sleep 5s; fi
done

echo "Finished. Now setting up fortis graphql service in kubernetes."
./install-fortis-services.sh \
  "${cassandra_ip}" \
  "${app_insights_id}" \
  "${feature_service_host}" \
  "${eh_conn_str}" \
  "${eh_path}" \
  "${eh_consumer_group}" \
  "${sb_queue_config}" \
  "${sb_queue_command}" \
  "${fortis_central_directory}" \
  "${sb_conn_str}" \
  "${storage_account_name}" \
  "${storage_account_key}" \
  "${fortis_admins}" \
  "${fortis_users}" \
  "${site_name}" \
  "${site_type}" \
  "${aad_client}"
while :; do
   fortis_service_ip="$(kubectl get svc project-fortis-services-lb -o jsonpath='{..ip}')"
   if [ -n "${fortis_service_ip}" ]; then break; else echo "Waiting for project-fortis-services IP"; sleep 5s; fi
done
readonly graphql_service_host="http://${fortis_service_ip}"

echo "Finished. Now setting up fortis react frontend."
./install-fortis-interfaces.sh \
    "${graphql_service_host}" \
    "${feature_service_host}" \
    "${storage_account_name}" \
    "${storage_account_key}" \
    "${fortis_interface_container}" \
    "${fortis_interface_host}" \
    "${aad_client}" \
    "${mapbox_access_token}" \
    "${mapbox_tile_layer_url}"

echo "Finished. Now installing Spark helm chart."
./install-spark.sh \
    "${cassandra_ip}" \
    "${app_insights_id}" \
    "${site_name}" \
    "${feature_service_host}" \
    "${graphql_service_host}" \
    "${k8resource_group}" \
    "${fortis_interface_host}" \
    "${eh_conn_str}" \
    "${fortis_central_directory}" \
    "${sb_conn_str}" \
    "${storage_account_name}" \
    "${storage_account_key}" \
    "${eh_path}" \
    "${eh_consumer_group}" \
    "${sb_queue_config}" \
    "${sb_queue_command}" \
    "${checkpointfileshare}" \
    "${k8spark_worker_count}" \
    "${agent_vm_size}"

echo "Finished. Finally, creating tags containing URLs for resources so that the user can find them later."
./create-tags.sh \
    "${k8resource_group}" \
    "${fortis_interface_host}" \
    "${site_name}" \
    "${graphql_service_host}"

echo "All done :)"
