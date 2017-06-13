echo "creating persistent volume storage class"
cp disks/azure-disk.yaml.tmpl ./azure-disk.yaml
sed -i.bu "s/DEPLOYMENT_PREFIX/$storage_account_name/" azure-disk.yaml

kubectl create -f ./disks/azure-disk.yaml