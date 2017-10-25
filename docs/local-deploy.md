[![Travis CI status](https://api.travis-ci.org/CatalystCode/project-fortis-spark.svg?branch=master)](https://travis-ci.org/CatalystCode/project-fortis-spark)

# project-fortis-spark

A repository for Project Fortis's data processing pipeline, built on Apache Spark.

## What's this? 

This project contains a Spark Streaming job that ingests data into the Fortis system. Specifically, we:

1. Ingest data in real time from sources such as Twitter, Facebook, Online Radio, Newspapers, Instagram, TadaWeb, and so forth.
2. Analyze and augment the raw data with intelligence like sentiment analysis, entity extraction, place recognition, or image understanding.
3. Narrow down the stream of events based on user-defined geo-areas, target keywords and blacklisted terms.
4. Perform trend detection and aggregate the metrics that back Project Fortis.

At the end of the ingestion pipeline, we publish the events and various aggregations to Cassandra.

> Run the local-health-check.sh script  in the main project directory to verify your machine is correctly setup.


## Local Development setup 

```sh
# set up variables for deployment environment
export HA_PROGRESS_DIR="..."
export APPINSIGHTS_INSTRUMENTATIONKEY="..."
export FORTIS_FEATURE_SERVICE_HOST="..."
export FORTIS_MODELS_DIRECTORY="..."
export FORTIS_CENTRAL_ASSETS_HOST="..."
export FORTIS_SERVICEBUS_NAMESPACE="..."
export FORTIS_SERVICEBUS_CONFIG_QUEUE="..."
export FORTIS_SERVICEBUS_POLICY_NAME="..."
export FORTIS_SERVICEBUS_POLICY_KEY="..."

# compile scala, run tests, build fat jar
export JAVA_OPTS="-Xmx2048M"
sbt assembly

# run on spark
spark-submit --driver-memory 4g target/scala-2.11/project-fortis-spark-assembly-0.0.1.jar
```

### Java Installation

This will install the appropriate JDK version for Fortis.
` sudo apt install openjdk-8-jdk`

### Maven Installation

This will install the appropriate mvn version for Fortis.
`sudo apt-get install maven`

### Node Installation

This will install the appropriate nodejs & npm for Fortis.

```sh
sudo apt-get install nodejs
sudo apt-get install npm
sudo npm cache clean -f
sudo npm install -g n
sudo n stable
```

### Scala Installation

This will install the appropriate scala version for Fortis.
`sudo apt-get install scala`

### SBT Installation

This will install simple build tool.

```sh
echo "deb https://dl.bintray.com/sbt/debian /" | sudo tee -a /etc/apt/sources.list.d/sbt.list
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2EE0EA64E40A89B84B2DF73499E82A75642AC823
sudo apt-get update
sudo apt-get install sbt
```

### Cassandra Installation

This will install the appropriate cassandra version for Fortis.

```sh
echo "deb http://www.apache.org/dist/cassandra/debian 311x main" | sudo tee -a /etc/apt/sources.list.d/cassandra.sources.list
curl https://www.apache.org/dist/cassandra/KEYS | sudo apt-key add -
sudo apt-get update
sudo apt-get install cassandra
```

### Kubectl Configuration

This will install the kubectl for use in cloud production environments for Fortis.

```sh
curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
chmod +x ./kubectl
sudo mv ./kubectl /usr/local/bin/kubectl
```

### Helm Configuration

This will install helm for use in cloud production environments for Fortis.

```sh
curl https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get > get_helm.sh
chmod 700 get_helm.sh
readonly helm_version="v2.5.1" 
./get_helm.sh -v "${helm_version}"
export HELM_HOME="/home/${user_name}/"
```