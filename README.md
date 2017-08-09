[![Travis CI status](https://api.travis-ci.org/CatalystCode/project-fortis-spark.svg?branch=master)](https://travis-ci.org/CatalystCode/project-fortis-spark)

# project-fortis-spark

A repository for Project Fortis's data processing pipeline, built on Apache Spark.

## What's this? ##

This project contains a Spark Streaming job that ingests data into the Fortis system. Specifically, we:

1. Ingest data in real time from sources such as Twitter, Facebook, Online Radio, Newspapers, Instagram, TadaWeb, and so forth.
2. Analyze and augment the raw data with intelligence like sentiment analysis, entity extraction, place recognition, or image understanding.
3. Narrow down the stream of events based on user-defined geo-areas, target keywords and blacklisted terms.
4. Perform trend detection and aggregate the metrics that back Project Fortis.

At the end of the ingestion pipeline, we publish the events and various aggregations to Cassandra.


## Development setup ##

```sh
# set up variables from deployment environment
export HA_PROGRESS_DIR="..."
export FORTIS_APPINSIGHTS_IKEY="..."
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
