<h1>Upgrading</h1>
Currently, components of the Fortis pipeline must be upgraded individually in order to migrate to a newer version. This document covers the upgrade process for each such component [WIP].

<h2>Spark Job</h2>
<h3>Description</h3>
The [Spark job](https://github.com/CatalystCode/project-fortis-spark) provides data ingestion and realtime analytics processing for incoming events and is the source of all data exposed by Project Fortis.

<h3>Upgrading to the latest version</h3>
This document assumes that you're already familiar with the process of remoting into the deployment VM, which is created and used automatically during an intial deployment of project Fortis. See the README at the root of this repo for details.
</p>
After SSH-ing into the deployment VM, follow these steps to upgrade the Spark job:
</p>

<h4>Elevate permissions</h4>

```bash
sudo su
```

<h4>Set up env for Kubernetes interactions</h4>

```bash
export HELM_HOME=/home/fortisadmin/; export KUBECONFIG=/home/fortisadmin/.kube/config
```
  
<h4>Change directory to the deployment folder</h4>

```bash
cd /var/lib/waagent/custom-script/download/0/fortisdeploy/ops/
```

<h4>**Backup your blob account name and key** which will be needed later during the upgrade</h4>

```bash
cat deis-apps/fortis-services/.env | grep USER_
```
You should see the following output:
```
USER_FILES_BLOB_ACCOUNT_NAME=  <write down this name>
USER_FILES_BLOB_ACCOUNT_KEY=   <write down this key>
```

<h4>Backup the existing `configmap` resource</h4>
This defines the environment of the current Spark job.

```bash
kubectl get -o yaml --export configmap spark-master-conf -n spark > ./spark-master-conf.bck.yaml
```

<h4>Terminate the Spark job and delete all Spark cluster resources</h4>
Data ingestion and analysis will be offline after this step until the upgrade is completed through the following steps:

```bash
kubectl delete namespace spark
```

<h4>Wait for all Spark pods to terminate</h4>
You can monitor this process using:

```bash
kubectl get pods -w -n spark
```

<h4>Purge Spark cluster metadata form Helm</h4>

```bash
helm delete spark-cluster --purge
```

<h4>Recreate the Spark namespace</h4>

```bash
kubectl create -f ./spark-namespace.yaml
```

<h4>Recreate the `configmap` from backup:</h4>

```bash
kubectl create -f ./spark-master-conf.bck.yaml
```

<h4>Install the latest version of the Spark Job</h4>

The `install-spark` script included on the deployment VM will fetch the latest release available on Github and use it to deploy and start the Spark job. 
</p><i>** Be sure to fill in your own values in the below command where applicable</i>

```bash
./install-spark.sh <number of Spark workers> "spark-master-conf" "https://fortiscentral.blob.core.windows.net/" "<your blob account name>" "<your blob key>"
```
This script will bring up data ingestion and analytics processing automatically. You should see new data coming into Fortis usually within 5 to 10 minutes of issuing the command.

<h4>Clean up</h4>

Delete the config map backup file:
```bash
rm ./spark-master-conf.bck.yaml
```
