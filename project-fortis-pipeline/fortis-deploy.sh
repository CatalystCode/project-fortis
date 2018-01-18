#!/usr/bin/env bash

print_usage() {
  cat << EOF
Command
  $0
Arguments
  --app_id|-ai                       [Required] : Service principal app id used to dynamically manage resource in your subscription
  --app_key|-ak                      [Required] : Service principal app key used to dynamically manage resource in your subscription
  --subscription_id|-si              [Required] : Subscription Id
  --tenant_id|-ti                    [Required] : Tenant Id
  --user_name|-un                    [Required] : Admin user name for the Kubernetes cluster
  --resource_group|-rg               [Required] : Resource group containing your Kubernetes cluster
  --master_fqdn|-mf                  [Required] : Master FQDN of your Kubernetes cluster
  --storage_account_name|-san        [Required] : Storage Account name used for Kubernetes's persistent storage
  --storage_account_key|-sak         [Required] : Storage Account key used for Kubernetes persistent storage
  --spark_worker_count|-sw           [Required] : Spark Worker Node Count
  --cassandra_node_count|-cn         [Required] : Cassandra Node Count
  --app_insights_id|-aii             [Required] : Application Insights Instramentation Key
  --gh_clone_path|-gc                [Required] : Github path to clone
  --location|-lo                     [Required] : Container cluster location
  --site_type|-sty                   [Required] : Fortis Site Type
  --prefix|-pf                       [Required] : Fortis Site Prefix
  --site_name|-sn                    [Required] : Fortis Site Name
  --eh_conn_str|-ec                  [Required] : Event Hub Connection String
  --sb_conn_str|-sb                  [Required] : Service Bus Connection String
  --agent_vm_size|-avms              [Required] : Size of the VMs used for the Kubernetes cluster
  --mapbox_access_token|-mat         [Required] : Mapbox access token
  --aad_client|-ad                   [Optional] : Active Directory Client Id to use for this deployment
  --fortis_admins|-fa                [Optional] : Email addresses of fortis admins, comma separated
  --fortis_users|-fu                 [Optional] : Email addresses of fortis users, comma separated
  --cogvisionsvctoken|-cvst          [Optional] : Cognitive Services Vision access token
  --cogtextsvctoken|-ctst            [Optional] : Cognitive Services Text access token
  --cogspeechsvctoken|-csst          [Optional] : Cognitive Services Speech access token
  --translationsvctoken|-tst         [Optional] : Cognitive Services Translation access token
EOF
}

throw_if_empty() {
  local name="$1"
  local value="$2"
  if [ -z "${value}" ]; then echo "Parameter '${name}' cannot be empty." 1>&2; print_usage; exit -1; fi
}

while [[ $# -gt 0 ]]; do
  key="$1"
  shift
  case ${key} in
    --app_id|-ai)
      app_id="$1"
      shift
      ;;
    --app_key|-ak)
      app_key="$1"
      shift
      ;;
    --subscription_id|-si)
      subscription_id="$1"
      shift
      ;;
    --tenant_id|-ti)
      tenant_id="$1"
      shift
      ;;
    --user_name|-un)
      user_name="$1"
      shift
      ;;
    --aad_client|-ad)
      aad_client="$1"
      shift
      ;;
    --fortis_admins|-fa)
      fortis_admins="$1"
      shift
      ;;
    --fortis_users|-fu)
      fortis_users="$1"
      shift
      ;;
    --site_name|-sn)
      site_name="$1"
      shift
      ;;
    --eh_conn_str|-ec)
      eh_conn_str="$1"
      shift
      ;;
    --sb_conn_str|-sb)
      sb_conn_str="$1"
      shift
      ;;
    --resource_group|-rg)
      resource_group="$1"
      shift
      ;;
    --prefix|-pf)
      prefix="$1"
      shift
      ;;
    --master_fqdn|-mf)
      master_fqdn="$1"
      shift
      ;;
    --site_type|-sty)
      site_type="$1"
      shift
      ;;
    --storage_account_name|-san)
      storage_account_name="$1"
      shift
      ;;
    --storage_account_key|-sak)
      storage_account_key="$1"
      shift
      ;;
    --spark_worker_count|-sw)
      spark_worker_count="$1"
      shift
      ;;
    --cassandra_node_count|-cn)
      cassandra_node_count="$1"
      shift
      ;;
    --app_insights_id|-aii)
      app_insights_id="$1"
      shift
      ;;
    --gh_clone_path|-gc)
      gh_clone_path="$1"
      shift
      ;;
    --location|-lo)
      location="$1"
      shift
      ;;
    --agent_vm_size|-avms)
      agent_vm_size="$1"
      shift
      ;;
    --mapbox_access_token|-mat)
      mapbox_access_token="$1"
      shift
      ;;
    --cogvisionsvctoken|-cvst)
      cogvisionsvctoken="$1"
      shift
      ;;
    --cogtextsvctoken|-ctst)
      cogtextsvctoken="$1"
      shift
      ;;
    --cogspeechsvctoken|-csst)
      cogspeechsvctoken="$1"
      shift
      ;;
    --translationsvctoken|-tst)
      translationsvctoken="$1"
      shift
      ;;
    *)
      echo "ERROR: Unknown argument '${key}' to script '$0'" 1>&2
      exit -1
  esac
done

install_azure_cli() {
  sudo apt-get -qq update && sudo apt-get -qq install -y libssl-dev libffi-dev python-dev
  echo "deb [arch=amd64] https://apt-mo.trafficmanager.net/repos/azure-cli/ wheezy main" | sudo tee /etc/apt/sources.list.d/azure-cli.list
  sudo apt-key adv --keyserver apt-mo.trafficmanager.net --recv-keys 417A0893
  sudo apt-get -qq install -y apt-transport-https
  sudo apt-get -qq update && sudo apt-get -qq install -y azure-cli
}

azure_login() {
  az login --service-principal -u "${app_id}" -p "${app_key}" -t "${tenant_id}"
  az account set --subscription "${subscription_id}"
}

install_helm() {
  curl https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get > get_helm.sh
  chmod 700 get_helm.sh
  readonly helm_version="v2.5.1" 
  ./get_helm.sh -v "${helm_version}"
  
  export HELM_HOME="/home/${user_name}/"
  helm init
}

setup_k8_cluster() {
  echo "Setting up access to locally copy the kubernetes cluster"
  # Create keys to copy over kube config
  temp_user_name="$(uuidgen | sed 's/-//g')"
  temp_key_path="$(mktemp -d)/temp_key"
  ssh-keygen -t rsa -N "" -f "${temp_key_path}" -V "+1d"
  temp_pub_key="$(cat "${temp_key_path}.pub")"

  while :; do
    master_vm_ids=$(az vm list -g "${resource_group}" --query "[].id" -o tsv | grep "${resource_group}" | grep "k8s-master-")
    if [ -n "${master_vm_ids}" ]; then break; else echo "Waiting for k8s-master"; sleep 10s; fi
  done
  echo "Master VM ids: ${master_vm_ids}"

  # Enable temporary credentials on every kubernetes master vm (since we don't know which vm will be used when we scp)
  az vm user update -u "${temp_user_name}" --ssh-key-value "${temp_pub_key}" --ids "${master_vm_ids}"

  # Copy kube config over from master kubernetes cluster and mark readable
  sudo mkdir -p "$(dirname "${kube_config_dest_file}")"
  sudo sh -c "ssh -o StrictHostKeyChecking=no -i \"${temp_key_path}\" ${temp_user_name}@${master_fqdn} sudo cat /home/${user_name}/.kube/config > \"${kube_config_dest_file}\""
  echo "Pulled down the kube config"

  # Remove temporary credentials on all our K8 master vms
  az vm user delete -u "${temp_user_name}" --ids "${master_vm_ids}"

  # Delete temp key
  rm "${temp_key_path}"
  rm "${temp_key_path}.pub"

  if [ ! -s "${kube_config_dest_file}" ]; then echo "Failed to copy kubeconfig for kubernetes cluster." >&2 && exit -1; fi

  sudo chmod +r "${kube_config_dest_file}"
}

install_kubectl() {
  kubectl_file="/usr/local/bin/kubectl"
  sudo curl -L -s -o "${kubectl_file}" "https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl"
  sudo chmod +x "${kubectl_file}"
  export KUBECONFIG=${kube_config_dest_file}

  kubectl cluster-info
}

throw_if_empty --app_id "${app_id}"
throw_if_empty --app_key "${app_key}"
throw_if_empty --subscription_id "${subscription_id}"
throw_if_empty --tenant_id "${tenant_id}"
throw_if_empty --user_name "${user_name}"
throw_if_empty --resource_group "${resource_group}"
throw_if_empty --master_fqdn "${master_fqdn}"
throw_if_empty --storage_account_name "${storage_account_name}"
throw_if_empty --storage_account_key "${storage_account_key}"
throw_if_empty --gh_clone_path "${gh_clone_path}"
throw_if_empty --spark_worker_count "${spark_worker_count}"
throw_if_empty --cassandra_node_count "${cassandra_node_count}"
throw_if_empty --site_type "${site_type}"
throw_if_empty --prefix "${prefix}"
throw_if_empty --site_name "${site_name}"
throw_if_empty --eh_conn_str "${eh_conn_str}"
throw_if_empty --sb_conn_str "${sb_conn_str}"
throw_if_empty --agent_vm_size "${agent_vm_size}"
throw_if_empty --mapbox_access_token "${mapbox_access_token}"

readonly kube_config_dest_file="/home/${user_name}/.kube/config"

echo "Logging into Azure"
if ! (command -v az >/dev/null); then install_azure_cli; fi
azure_login

echo "Finished. Setting up Kubernetes cluster"
setup_k8_cluster

echo "Finished. Installing Kubectl"
if ! (command -v kubectl >/dev/null); then install_kubectl; fi

echo "Finished. Now installing Helm"
if ! (command -v helm >/dev/null); then install_helm; fi

echo "Finished. Adding storage share for spark checkpointing"
readonly checkpointfileshare="checkpoint"
az storage share create \
  --name "${checkpointfileshare}" \
  --account-key "${storage_account_key}" \
  --account-name "${storage_account_name}"

if [ -z "${cogvisionsvctoken}" ]; then
  echo "Finished. Now setting up cognitive services vision account"
  name="${storage_account_name}ComputerVision"
  az cognitiveservices account create -l "${location}" --kind "ComputerVision" --sku "S1" --yes -g "${resource_group}" -n "${name}"
  cogvisionsvctoken="$(az cognitiveservices account keys list -g "${resource_group}" -n "${name}" --output tsv | cut -f1)"
fi
if [ -z "${cogspeechsvctoken}" ]; then
  echo "Finished. Now setting up cognitive services speech account"
  name="${storage_account_name}STT"
  az cognitiveservices account create -l "global" --kind "Bing.Speech" --sku "S0" --yes -g "${resource_group}" -n "${name}"
  cogspeechsvctoken="$(az cognitiveservices account keys list -g "${resource_group}" -n "${name}" --output tsv | cut -f1)"
fi
if [ -z "${cogtextsvctoken}" ]; then
  echo "Finished. Now setting up cognitive services text account"
  name="${storage_account_name}NLP"
  az cognitiveservices account create -l "${location}" --kind "TextAnalytics" --sku "S0" --yes -g "${resource_group}" -n "${name}"
  cogtextsvctoken="$(az cognitiveservices account keys list -g "${resource_group}" -n "${name}" --output tsv | cut -f1)"
fi
if [ -z "${translationsvctoken}" ]; then
  echo "Finished. Now setting up cognitive services translation account"
  name="${storage_account_name}Translation"
  az cognitiveservices account create -l "global" --kind "TextTranslation" --sku "S1" --yes -g "${resource_group}" -n "${name}"
  translationsvctoken="$(az cognitiveservices account keys list -g "${resource_group}" -n "${name}" --output tsv | cut -f1)"
fi

echo "Finished. Installing deployment scripts"
if ! (command -v git >/dev/null); then sudo apt-get -qq install -y git; fi
git clone --depth=1 "${gh_clone_path}" /tmp/fortis-project
cp -r /tmp/fortis-project/project-fortis-pipeline .
cd project-fortis-pipeline/ops/ || exit -2
chmod 752 create-cluster.sh

echo "Finished. Setting up cluster"
./create-cluster.sh \
  "${location}" \
  "${cassandra_node_count}" \
  "${spark_worker_count}" \
  "${resource_group}" \
  "${storage_account_name}" \
  "${app_insights_id}" \
  "${site_name}" \
  "${eh_conn_str}" \
  "${sb_conn_str}" \
  "${storage_account_key}" \
  "${checkpointfileshare}" \
  "${site_type}" \
  "${agent_vm_size}" \
  "${fortis_admins}" \
  "${fortis_users}" \
  "${aad_client}" \
  "${mapbox_access_token}" \
  "${cogvisionsvctoken}" \
  "${cogspeechsvctoken}" \
  "${cogtextsvctoken}" \
  "${translationsvctoken}"

# shellcheck disable=SC2181
if [ $? -ne 0 ]; then
  echo "Cluster creation failed" >&2
  exit 1
fi
