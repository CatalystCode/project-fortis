# Upgrading
Currently, components of the Fortis pipeline must be upgraded individually in order to migrate to a newer version. This document covers the upgrade process for each such component (WIP).

## Spark Job
### Description
The [Spark job](github.com/CatalystCode/project-fortis-spark) provides data ingestion and realtime analytics processing for incoming events and is the source of all data exposed by Project Fortis.

### Upgrading to the latest version
This document assumes that you're already familiar with the process of remoting into the deployment VM, which is created and used automatically during an intial deployment of project Fortis. See the README at the root of this repo for details.

After SSH-ing into the deployment VM, follow these steps to upgrade the Spark job:


#### Elevate permissions

```bash
sudo su
```

#### Set up env for Kubernetes interactions

```bash
export HELM_HOME=/home/fortisadmin/; export KUBECONFIG=/home/fortisadmin/.kube/config
```
  
#### Change directory to the deployment folder

```bash
cd /var/lib/waagent/custom-script/download/0/fortisdeploy/ops/
```

#### Manually backup your blob account name and key
These will be needed later during the upgrade.
```bash
cat deis-apps/fortis-services/.env | grep USER_
```
You should see the following output:
```
USER_FILES_BLOB_ACCOUNT_NAME=  <write down this name>
USER_FILES_BLOB_ACCOUNT_KEY=   <write down this key>
```

#### Backup the existing `configmap` resource
This defines the environment of the current Spark job.

```bash
kubectl get -o yaml --export configmap spark-master-conf -n spark > ./spark-master-conf.bck.yaml
```

#### Terminate the Spark job and delete all Spark cluster resources
Data ingestion and analysis will be offline after this step until the remaining upgrade steps have been completed.

```bash
kubectl delete namespace spark
```

#### Wait for all Spark pods to terminate
You can monitor this process using:

```bash
kubectl get pods -w -n spark
```

#### Purge Spark cluster metadata form Helm

```bash
helm delete spark-cluster --purge
```

#### Recreate the Spark namespace

```bash
kubectl create -f ./spark-namespace.yaml
```

#### Recreate the `configmap` from backup

```bash
kubectl create -f ./spark-master-conf.bck.yaml -n spark
```

#### Install the latest version of the Spark Job

The `install-spark` script included on the deployment VM will fetch the latest release available on Github and use it to deploy and start the Spark job. 

<i>** Be sure to fill in your own values in the below command where applicable</i>

```bash
./install-spark.sh <number of Spark workers> "spark-master-conf" "https://fortiscentral.blob.core.windows.net/" "<your blob account name>" "<your blob key>"
```
This script will bring up data ingestion and analytics processing automatically. You should see new data coming into Fortis usually within 5 to 10 minutes of issuing the command.

#### Clean up

Delete the config map backup file:
```bash
rm ./spark-master-conf.bck.yaml
```
