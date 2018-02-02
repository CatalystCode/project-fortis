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
readonly cogvisionsvctoken="${18}"
readonly cogspeechsvctoken="${19}"
readonly cogtextsvctoken="${20}"
readonly translationsvctoken="${21}"
readonly fortis_site_clone_url="${22}"
readonly endpoint_protection="${23}"
readonly tls_hostname="${24}"
readonly tls_certificate_b64="${25}"
readonly tls_key_b64="${26}"
readonly lets_encrypt_email="${27}"
readonly lets_encrypt_api_endpoint="${28}"
readonly user_name="${29}"

if [ -n "${aad_client}" ] || [ "${endpoint_protection}" != "none" ]; then readonly fortis_interface_protocol="https"; else readonly fortis_interface_protocol="http"; fi
readonly feature_service_host="http://fortis-features.eastus.cloudapp.azure.com"
readonly fortis_central_directory="https://fortiscentral.blob.core.windows.net/"
readonly fortis_interface_container="public"
readonly fortis_interface_host="${fortis_interface_protocol}://${storage_account_name}.blob.core.windows.net/${fortis_interface_container}"
readonly eh_path="published-messages"
readonly eh_consumer_group="\$Default"
readonly sb_queue_config="configuration"
readonly sb_queue_command="command"
readonly mapbox_tile_layer_url="https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/256/{z}/{x}/{y}"

if ! (command -v jq >/dev/null); then sudo apt-get -qq install -y jq; fi
readonly latest_version="$(curl -s 'https://api.github.com/repos/CatalystCode/project-fortis/releases/latest' | jq -r '.tag_name')"

chmod -R 752 .

echo "Waiting for Tiller pod to get ready"
while ! (kubectl get po --namespace kube-system | grep -i 'tiller' | grep -i 'running' | grep -i '1/1'); do
  echo "Waiting for Tiller pod"
  sleep 10s
done

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
  "${aad_client}" \
  "${mapbox_access_token}" \
  "${cogvisionsvctoken}" \
  "${cogspeechsvctoken}" \
  "${cogtextsvctoken}" \
  "${translationsvctoken}" \
  "${fortis_site_clone_url}" \
  "${endpoint_protection}" \
  "${tls_hostname}" \
  "${tls_certificate_b64}" \
  "${tls_key_b64}" \
  "${lets_encrypt_email}" \
  "${lets_encrypt_api_endpoint}" \
  "${latest_version}"
while :; do
  if [ "${endpoint_protection}" == "none" ]; then
    fortis_service_ip="$(kubectl get svc project-fortis-services-lb -o jsonpath='{..ip}')"
  else
    fortis_service_ip="$(kubectl get svc/nginx-ingress-controller --namespace=nginx-ingress -o jsonpath='{..ip}')"
  fi
  if [ -n "${fortis_service_ip}" ]; then break; else echo "Waiting for project-fortis-services IP"; sleep 5s; fi
done
if [ "${endpoint_protection}" == "none" ]; then
  readonly graphql_service_host="http://${fortis_service_ip}"
else
  readonly graphql_service_host="https://${tls_hostname}"
  if [ "${endpoint_protection}" == "tls_lets_encrypt" ]; then
    readonly mx_record_entry="@.${lets_encrypt_email#*@}"
  fi
fi

echo "Finished. Now setting up fortis graphql service upgrade script."
readonly services_upgrade_script="/home/${user_name}/upgrade-fortis-services.sh"
cat > "${services_upgrade_script}" << EOF
#!/usr/bin/env bash
readonly release_to_install="\$1"

if [ -z "\$release_to_install" ]; then
  echo "Usage: \$0 <release_to_install>" >&2; exit 1
fi

if curl -s "https://api.github.com/repos/CatalystCode/project-fortis/releases/tags/\${release_to_install}" -w '%{http_code}' | grep -q '^404$'; then
  echo "Release \${release_to_install} does not exist" >&2; exit 2
fi

install_dir="\$(mktemp -d /tmp/fortis-services-XXXXXX)"

export KUBECONFIG="${KUBECONFIG}"

kubectl get po --selector='io.kompose.service=project-fortis-services' -o json \\
| jq -r '.items[] | .metadata.name' \\
| while read pod; do
  pod_spec="\${install_dir}/\${pod}.yaml"
  kubectl get po "\${pod}" -o yaml > "\${pod_spec}"
  sed -i "s|image: cwolff/project_fortis_services:.*$|image: cwolff/project_fortis_services:\${release_to_install}|g" "\${pod_spec}"
  kubectl replace --force -f "\${pod_spec}"
done
EOF
chown "${user_name}:${user_name}" "${services_upgrade_script}"
chmod +x "${services_upgrade_script}"

echo "Finished. Now setting up fortis react frontend."
./install-fortis-interfaces.sh \
  "${graphql_service_host}" \
  "${storage_account_name}" \
  "${storage_account_key}" \
  "${fortis_interface_container}" \
  "${fortis_interface_host}" \
  "${aad_client}" \
  "${mapbox_tile_layer_url}" \
  "${latest_version}"

echo "Finished. Now setting up fortis react frontend upgrade script."
readonly interfaces_upgrade_script="/home/${user_name}/upgrade-fortis-interfaces.sh"
cat > "${interfaces_upgrade_script}" << EOF
#!/usr/bin/env bash
readonly release_to_install="\$1"

if [ -z "\$release_to_install" ]; then
  echo "Usage: \$0 <release_to_install>" >&2; exit 1
fi

if curl -s "https://api.github.com/repos/CatalystCode/project-fortis/releases/tags/\${release_to_install}" -w '%{http_code}' | grep -q '^404$'; then
  echo "Release \${release_to_install} does not exist" >&2; exit 2
fi

${PWD}/install-fortis-interfaces.sh \\
  "${graphql_service_host}" \\
  "${storage_account_name}" \\
  "${storage_account_key}" \\
  "${fortis_interface_container}" \\
  "${fortis_interface_host}" \\
  "${aad_client}" \\
  "${mapbox_tile_layer_url}" \\
  "\${release_to_install}"
EOF
chown "${user_name}:${user_name}" "${interfaces_upgrade_script}"
chmod +x "${interfaces_upgrade_script}"

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
  "${agent_vm_size}" \
  "${cogvisionsvctoken}" \
  "${cogspeechsvctoken}" \
  "${cogtextsvctoken}" \
  "${translationsvctoken}" \
  "${latest_version}"

echo "Finished. Verifying deployment."
if [ "${endpoint_protection}" == "none" ]; then
  ./verify-deployment.sh \
    "${graphql_service_host}"
else
  # request a public ip in order to verify the cluster deployment
  # we aren't testing the TLS ingress due to manual steps required to get
  # that completely setup
  kubectl expose deployment project-fortis-services \
    --type "LoadBalancer" \
    --name "project-fortis-services-verification-lb"
  # wait for the verification endpoint to come up
  while :; do
    fortis_service_verification_ip="$(kubectl get svc project-fortis-services-verification-lb -o jsonpath='{..ip}')"
    if [ -n "${fortis_service_verification_ip}" ]; then break; else echo "Waiting for project-fortis-services-verification IP"; sleep 5s; fi
  done
  echo "Got service IP: ${fortis_service_verification_ip}"
  project_fortis_services_verification_endpoint="http://${fortis_service_verification_ip}"
  echo "Endpoint: ${project_fortis_services_verification_endpoint}"
  ./verify-deployment.sh \
    "${project_fortis_services_verification_endpoint}"
fi

# shellcheck disable=SC2181
if [ $? -ne 0 ]; then
  echo "Deployment verification failed" >&2
  exit 1
fi

if [ "${endpoint_protection}" != "none" ]; then
  if ! kubectl delete service project-fortis-services-verification-lb; then
    echo "Unable to delete verification endpoint" >& 2
    exit 1
  fi
fi

echo "Finished. Finally, creating tags containing URLs for resources so that the user can find them later."
./create-tags.sh \
  "${k8resource_group}" \
  "${fortis_interface_host}" \
  "${site_name}" \
  "${graphql_service_host}" \
  "${tls_hostname}" \
  "${fortis_service_ip}" \
  "${mx_record_entry}"

echo "All done :)"
