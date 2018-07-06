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
readonly lets_encrypt_email="${23}"
readonly user_name="${24}"

readonly fortis_central_directory="https://fortiscentral.blob.core.windows.net/"
readonly fortis_interface_container="public"
readonly fortis_backup_container="backups"
readonly fortis_interface_host="https://${storage_account_name}.blob.core.windows.net/${fortis_interface_container}"
readonly eh_path="published-messages"
readonly eh_consumer_group="\$Default"
readonly sb_queue_config="configuration"
readonly sb_queue_command="command"
readonly mapbox_tile_layer_url="https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/256/{z}/{x}/{y}"
readonly featuresdb_name="pgsql${storage_account_name}"

if ! (command -v jq >/dev/null); then sudo apt-get -qq install -y jq; fi
readonly latest_version="$(curl -s 'https://api.github.com/repos/CatalystCode/project-fortis/releases/latest' | jq -r '.tag_name')"

chmod -R 752 .

echo "Installing featureService in kubernetes"
./install-featureservice.sh \
  "${featuresdb_name}" \
  "${k8resource_group}" \
  "${k8location}" \
  "${user_name}"
while :; do
  feature_service_ip="$(kubectl get svc featureservice -n featureservice -o jsonpath='{..clusterIP}')"
  if [ -n "${feature_service_ip}" ]; then break; else echo "Waiting for featureService IP"; sleep 5s; fi
done
readonly feature_service_host="http://${feature_service_ip}"

echo "Finished. Waiting for Tiller pod to get ready"
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
readonly cassandra_port="9042"
readonly cassandra_username="cassandra"
readonly cassandra_password="cassandra"

echo "Finished. Now setting up fortis graphql service in kubernetes."
readonly tls_hostname="${storage_account_name}.$(echo "${k8location}" | tr '[:upper:]' '[:lower:]' | tr -d ' ').cloudapp.azure.com"
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
  "${lets_encrypt_email}" \
  "${latest_version}" \
  "${cassandra_port}" \
  "${cassandra_username}" \
  "${cassandra_password}" \
  "${k8cassandra_node_count}" \
  "${tls_hostname}"

while :; do
  fortis_service_ip="$(kubectl get svc/nginx-ingress-controller -o jsonpath='{..ip}')"
  if [ -n "${fortis_service_ip}" ]; then break; else echo "Waiting for project-fortis-services IP"; sleep 5s; fi
done
readonly ingressipid="$(az network public-ip list --resource-group "" --output tsv --query "[?ipAddress!=null]|[?contains(ipAddress, '${fortis_service_ip}')].[id]")"
az network public-ip update --ids "${ingressipid}" --dns-name "${storage_account_name}" --output tsv --query dnsSettings.fqdn
readonly graphql_service_host="https://${tls_hostname}"

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

export KUBECONFIG="${KUBECONFIG}"

kubectl set image 'deployment/project-fortis-services' "project-fortis-services=cwolff/project_fortis_services:\${release_to_install}"
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

echo "Finished. Now installing fortis backup scripts."
./install-fortis-backup.sh \
  "${cassandra_ip}" \
  "${cassandra_port}" \
  "${cassandra_username}" \
  "${cassandra_password}" \
  "${storage_account_name}" \
  "${storage_account_key}" \
  "${fortis_backup_container}" \
  "${latest_version}"

echo "Finished. Now setting up fortis backup upgrade script."
readonly backup_upgrade_script="/home/${user_name}/upgrade-fortis-backup.sh"
cat > "${backup_upgrade_script}" << EOF
#!/usr/bin/env bash
readonly release_to_install="\$1"

if [ -z "\$release_to_install" ]; then
  echo "Usage: \$0 <release_to_install>" >&2; exit 1
fi

if curl -s "https://api.github.com/repos/CatalystCode/project-fortis/releases/tags/\${release_to_install}" -w '%{http_code}' | grep -q '^404$'; then
  echo "Release \${release_to_install} does not exist" >&2; exit 2
fi

export KUBECONFIG="${KUBECONFIG}"

kubectl set image 'deployment/project-fortis-backup' "project-fortis-backup=cwolff/project_fortis_backup:\${release_to_install}"
EOF
chown "${user_name}:${user_name}" "${backup_upgrade_script}"
chmod +x "${backup_upgrade_script}"

while :; do
  services_pod="$(kubectl get po --selector='io.kompose.service=project-fortis-services' -o jsonpath='{.items[0].metadata.name}')"

  if kubectl exec "${services_pod}" -- /usr/bin/wget -qO- "${feature_service_host}/features/name/paris" > /dev/null; then
    break
  else
    echo "featureService not yet available, waiting..."
    sleep 1m
  fi
done

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
  "${latest_version}" \
  "${cassandra_port}" \
  "${cassandra_username}" \
  "${cassandra_password}" \
  "${k8location}"

echo "Finished. Now setting up fortis spark job upgrade script."
if ! (command -v yaml > /dev/null); then npm install --global yaml-cli; fi

readonly spark_upgrade_script="/home/${user_name}/upgrade-fortis-spark.sh"
cat > "${spark_upgrade_script}" << EOF
#!/usr/bin/env bash
readonly release_to_install="\$1"

if [ -z "\$release_to_install" ]; then
  echo "Usage: \$0 <release_to_install>" >&2; exit 1
fi

if curl -s "https://api.github.com/repos/CatalystCode/project-fortis/releases/tags/\${release_to_install}" -w '%{http_code}' | grep -q '^404$'; then
  echo "Release \${release_to_install} does not exist" >&2; exit 2
fi

export KUBECONFIG="${KUBECONFIG}"
export HELM_HOME="${HELM_HOME}"

new_spark_command="\$(yaml get <(helm get values spark-cluster) 'Master.SparkSubmitCommand' | sed "s|fortis-[0-9.]*jar|fortis-\${release_to_install}.jar|g")"

helm upgrade \\
  spark-cluster \\
  ${PWD}/charts/spark \\
  --namespace spark \\
  --set Master.SparkSubmitCommand="\${new_spark_command}"
EOF
chown "${user_name}:${user_name}" "${spark_upgrade_script}"
chmod +x "${spark_upgrade_script}"

echo "Finished. Now setting up wrapper upgrade script."
readonly upgrade_script="/home/${user_name}/upgrade-fortis.sh"
cat > "${upgrade_script}" << EOF
#!/usr/bin/env bash

${interfaces_upgrade_script} "\$1"
${services_upgrade_script} "\$1"
${backup_upgrade_script} "\$1"
${spark_upgrade_script} "\$1"
EOF
chown "${user_name}:${user_name}" "${upgrade_script}"
chmod +x "${upgrade_script}"

echo "Finished. Finally, creating tags containing URLs for resources so that the user can find them later."
./create-tags.sh \
  "${k8resource_group}" \
  "${fortis_interface_host}" \
  "${site_name}" \
  "${graphql_service_host}"

echo "All done :)"
