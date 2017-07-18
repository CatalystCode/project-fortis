[![Travis CI status](https://api.travis-ci.org/CatalystCode/project-fortis-spark.svg?branch=master)](https://travis-ci.org/CatalystCode/project-fortis-spark)

# project-fortis-ingestion

A repository for Project Fortis's data ingestion Spark jobs.

## What's this? ##

This project contains a Spark job that ingests data into the Fortis system. Specifically, we:

1. Ingest data in real time from sources such as Twitter, Facebook, Online Radio, Newspapers, Instagram, TadaWeb, and so forth
2. Analyze and augment the raw data with intelligence like sentiment analysis, entity extraction, place recognition, or image understanding
3. Narrow down the stream of events based on user-defined geo-areas, target keywords and blacklisted terms

At the end of the ingestion pipeline, we publish the events to Kafka from where any downstream processors or aggregators
can consume the data. The schema of the data in Kafka is as follows:

```json
{
    "title": "FortisEvent",
    "type": "object",
    "properties": {
        "language": {
          "type": "string"
        },
        "locations": {
          "description": "The ids of all places mentioned in the event",
          "type": "array",
          "items": {
            "description": "A Who's-On-First id",
            "type": "string"
          }
        },
        "sentiments": {
          "type": "array",
          "items": {
            "description": "Neutral sentiment is 0.6, 0 is most negative, 1 is most positive.",
            "type": "number",
            "minimum": 0,
            "maximum": 1
          }
        },
        "keywords": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "entities": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "summary": {
          "type": "string"
        },
        "id": {
          "type": "string"
        },
        "createdAtEpoch": {
          "type": "number"
        },
        "body": {
          "type": "string"
        },
        "title": {
          "type": "string"
        },
        "publisher": {
          "type": "string"
        },
        "sourceUrl": {
          "type": "string"
        },
        "sharedLocations": {
          "description": "The ids of all places explicitly tagged in the event",
          "type": "array",
          "items": {
            "description": "A Who's-On-First id",
            "type": "string"
          }
        }
    },
    "required": [
      "id",
      "createdAtEpoch"
    ]
}
```


## Development setup ##

```sh
# set up variables from deployment environment
export FORTIS_APPINSIGHTS_IKEY="..."
export FORTIS_FEATURE_SERVICE_HOST="..."
export FORTIS_KAFKA_HOST="..."
export FORTIS_KAFKA_TOPIC="..."
export OXFORD_VISION_TOKEN="..."
export OXFORD_SPEECH_TOKEN="..."
export OXFORD_LANGUAGE_TOKEN="..."
export EH_PROGRESS_DIR="..."

# set up variables for local development environment
# in production, these will come from the settings data-store
export INSTAGRAM_AUTH_TOKEN="..."
export BING_ACCESS_TOKEN="..."
export BING_SEARCH_INSTANCE_ID="..."
export REDDIT_APPLICATION_ID="..."
export REDDIT_APPLICATION_SECRET="..."
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
export CUSTOMEVENTS_EH_POLICY_NAME="..."
export CUSTOMEVENTS_EH_POLICY_KEY="..."
export CUSTOMEVENTS_EH_NAMESPACE="..."
export CUSTOMEVENTS_EH_NAME="..."
export CUSTOMEVENTS_EH_PARTITION_COUNT="..."

# compile scala, run tests, build fat jar
export JAVA_OPTS="-Xmx2048M"
sbt assembly

# run on spark
spark-submit --driver-memory 4g target/scala-2.11/project-fortis-spark-assembly-0.0.1.jar
```
