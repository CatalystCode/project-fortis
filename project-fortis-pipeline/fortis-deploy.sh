#!/usr/bin/env bash

echo "***********************************************************************"
echo "Now running $0 $*"
echo "***********************************************************************"

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
  --cassandra_node_count|-cn         [Required] : Port used for Front50, defaulted to 8080
  --app_insights_id|-aii             [Required] : Application Insights Instramentation Key
  --kubernetes_name|-kn              [Required] : Kubernetes ACS Cluster Name
  --gh_clone_path|-gc                [Required] : Github path to clone
  --location|-lo                     [Required] : Container cluster location
  --site_type|-sty                   [Required] : Fortis Site Type
  --prefix|-pf                       [Required] : Fortis Site Prefix
  --site_name|-sn                    [Required] : Fortis Site Name
  --eh_conn_str|-ec                  [Required] : Event Hub Connection String
  --sb_conn_str|-sb                  [Required] : Service Bus Connection String
  --agent_vm_size|-avms              [Required] : Size of the VMs used for the Kubernetes cluster
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
    --kubernetes_name|-kn)
      kubernetes_name="$1"  # shellcheck disable=SC2034
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

  sleep 30
}

setup_k8_cluster() {
  echo "Setting up access to locally copy the kubernetes cluster"
  # Create keys to copy over kube config
  temp_user_name="$(uuidgen | sed 's/-//g')"
  temp_key_path="$(mktemp -d)/temp_key"
  ssh-keygen -t rsa -N "" -f "${temp_key_path}" -V "+1d"
  temp_pub_key="$(cat "${temp_key_path}.pub")"

  master_vm_ids=$(az vm list -g "${resource_group}" --query "[].id" -o tsv | grep "${resource_group}" | grep "k8s-master-")
  >&2 echo "Master VM ids: ${master_vm_ids}"

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

install_git() {
  sudo apt-get -qq install -y git
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

readonly kube_config_dest_file="/home/${user_name}/.kube/config"

if ! (command -v az >/dev/null); then install_azure_cli; fi

azure_login
setup_k8_cluster

# Install and setup Kubernetes cli for admin user
echo "Installing Kubectl"
if ! (command -v kubectl >/dev/null); then install_kubectl; fi

echo "Installed Kubectl. Now installing Helm"

# Install and setup Helm for cluster chart setup
if ! (command -v helm >/dev/null); then install_helm; fi

echo "Installed Helm. Adding storage share for spark checkpointing."

#Create the K8 azure file storage container
echo "creating azure file share"
readonly checkpointfileshare="checkpoint"

az storage share create \
    --name "${checkpointfileshare}" \
    --account-key "${storage_account_key}" \
    --account-name "${storage_account_name}"

sleep 10

install_git
git clone --depth=1 "${gh_clone_path}" /tmp/project_fortis
cp -r /tmp/project_fortis/project-fortis-pipeline .

cd project-fortis-pipeline/ops/ || exit -2

readonly k8location="${location}"
readonly k8cassandra_node_count="${cassandra_node_count}"
readonly k8spark_worker_count="${spark_worker_count}"
readonly k8resource_group="${resource_group}"

chmod 752 create-cluster.sh
./create-cluster.sh \
    "${k8location}" \
    "${k8cassandra_node_count}" \
    "${k8spark_worker_count}" \
    "${k8resource_group}" \
    "${storage_account_name}" \
    "${app_insights_id}" \
    "${site_name}" \
    "${eh_conn_str}" \
    "${sb_conn_str}" \
    "${storage_account_key}" \
    "${checkpointfileshare}" \
    "${site_type}" \
    "${agent_vm_size}" \
