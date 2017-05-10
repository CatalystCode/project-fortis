# project-fortis-spark

A repository for all spark jobs running on fortis

## What's this? ##

This project contains demos of the various Spark Streaming data processing methods for Project Fortis:

- Ingesting Instagram pictures and analyzing them using Cognitive Services.
- Ingesting Twitter tweets and extracting locations using Open Street Map.

Run it via:

```sh
# set up all the requisite environment variables
export INSTAGRAM_AUTH_TOKEN="..."
export OXFORD_VISION_TOKEN="..."
export TWITTER_CONSUMER_KEY="..."
export TWITTER_CONSUMER_SECRET="..."
export TWITTER_ACCESS_TOKEN="..."
export TWITTER_ACCESS_TOKEN_SECRET="..."
export FACEBOOK_AUTH_TOKEN="..."
export FACEBOOK_APP_ID="..."
export FACEBOOK_APP_SECRET="..."

# compile scala, run tests, build fat jar
export JAVA_OPTS="-Xmx2048M"
sbt assembly

# run on spark
spark-submit --class DemoFortis --master local[2] --driver-memory 4g target/scala-2.11/project-fortis-spark-assembly-0.0.1.jar instagram
spark-submit --class DemoFortis --master local[2] --driver-memory 4g target/scala-2.11/project-fortis-spark-assembly-0.0.1.jar twitter
spark-submit --class DemoFortis --master local[2] --driver-memory 4g target/scala-2.11/project-fortis-spark-assembly-0.0.1.jar facebook
```
