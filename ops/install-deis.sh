echo "creating deis storage account $k8location"
DEIS_STORAGE_ACCOUNT_NAME=k8deisstorage

sudo az storage account create -n $DEIS_STORAGE_ACCOUNT_NAME -l $k8location -g $k8resource_group --sku Standard_LRS
export DEIS_STORAGE_ACCOUNT_KEY=`sudo az storage account keys list -n $DEIS_STORAGE_ACCOUNT_NAME -g $k8resource_group --query [0].value --output tsv`

echo "starting deis installation using helm"
sudo helm repo add deis https://charts.deis.com/workflow
sudo helm install deis/workflow --name deis --namespace=deis --set global.storage=azure,azure.accountname=$DEIS_STORAGE_ACCOUNT_NAME,azure.accountkey=$DEIS_STORAGE_ACCOUNT_KEY,azure.registry_container=registry,azure.database_container=database,azure.builder_container=builder