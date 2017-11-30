# project-fortis-pipeline

This repository contains scripts that are used as part of the deployment of
Fortis to Azure. The ARM template (azuredeploy.json) first sets up some
resources in Azure (e.g. Kubernetes cluster, storage accounts, ServiceBus,
etc.) and then the scripts in this repository finish the setup by, for
example, deploying Cassandra and Spark to the Kubernetes cluster via Helm.
