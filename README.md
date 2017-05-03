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

# compile scala, run tests, build fat jar
sbt assembly

# run on spark
spark-submit --class DemoInstagram --master local[4] target/scala-2.11/simple-project-assembly-1.0.jar
spark-submit --class DemoLocations --master local[4] target/scala-2.11/simple-project-assembly-1.0.jar
```
