[![Travis CI status](https://api.travis-ci.org/CatalystCode/project-fortis-spark.svg?branch=master)](https://travis-ci.org/CatalystCode/project-fortis-spark)

# project-fortis-spark

A repository for all spark jobs running on fortis

## What's this? ##

This project contains demos of the various Spark Streaming data processing methods for Project Fortis:

- Ingesting Instagram pictures and analyzing them using Cognitive Services.
- Ingesting Twitter tweets and extracting locations using Open Street Map.

Run it via:

```sh
# set up all the requisite environment variables
export FORTIS_APPINSIGHTS_IKEY="..."
export FORTIS_FEATURE_SERVICE_HOST="..."
export INSTAGRAM_AUTH_TOKEN="..."
export OXFORD_VISION_TOKEN="..."
export OXFORD_LANGUAGE_TOKEN="..."
export TWITTER_CONSUMER_KEY="..."
export TWITTER_CONSUMER_SECRET="..."
export TWITTER_ACCESS_TOKEN="..."
export TWITTER_ACCESS_TOKEN_SECRET="..."
export FACEBOOK_AUTH_TOKEN="..."
export FACEBOOK_APP_ID="..."
export FACEBOOK_APP_SECRET="..."
export TADAWEB_EH_POLICY_NAME="..."
export TADAWEB_EH_POLICY_KEY="..."
export TADAWEB_EH_NAMESPACE="..."
export TADAWEB_EH_NAME="..."
export TADAWEB_EH_PARTITION_COUNT="..."
export EH_PROGRESS_DIR="..."

# compile scala, run tests, build fat jar
export JAVA_OPTS="-Xmx2048M"
sbt assembly

# run on spark
spark-submit --class DemoFortis --master local[2] --driver-memory 4g target/scala-2.11/project-fortis-spark-assembly-0.0.1.jar instagram
spark-submit --class DemoFortis --master local[2] --driver-memory 4g target/scala-2.11/project-fortis-spark-assembly-0.0.1.jar twitter
spark-submit --class DemoFortis --master local[2] --driver-memory 4g target/scala-2.11/project-fortis-spark-assembly-0.0.1.jar facebook
spark-submit --class DemoFortis --master local[2] --driver-memory 4g target/scala-2.11/project-fortis-spark-assembly-0.0.1.jar tadaweb
```
```
