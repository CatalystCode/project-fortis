# fortis-services

[![Travis CI status](https://api.travis-ci.org/CatalystCode/project-fortis-services.svg?branch=master)](https://travis-ci.org/CatalystCode/project-fortis-services)

A node-based azure web app meant to host express web services

## Environment variables

```sh
ENABLE_V2=1  # switch to new Cassandra backend instead of old Postgres backend

PUBLISH_EVENTS_EVENTHUB_CONNECTION_STRING="..."
PUBLISH_EVENTS_EVENTHUB_PATH="..."
PUBLISH_EVENTS_EVENTHUB_PARTITION="..."

USER_FILES_BLOB_ACCOUNT_NAME="..."
USER_FILES_BLOB_ACCOUNT_KEY="..."

TRANSLATION_SERVICE_ACCOUNT_KEY="..."

FACEBOOK_AUTH_TOKEN="..."

FORTIS_FEATURE_SERVICE_HOST="..."
APPINSIGHTS_INSTRUMENTATIONKEY="..."

CASSANDRA_CONTACT_POINTS="..."
CASSANDRA_KEYSPACE="fortis"
CASSANDRA_USERNAME="cassandra"
CASSANDRA_PASSWORD="cassandra"
```

## Development Setup

In order to serve data from the GraphQL services, you will need to a functioning Cassandra installation.

### Setting Up Cassandra on Windows Linux Subsystem (Ubuntu)

As a prerequisite to setting up Cassandra, you will need to make sure you have Java 8 or better setup.

Then follow these commands to dowloand and run your local Cassandra instance:

```sh
curl -O http://www-eu.apache.org/dist/cassandra/3.11.0/apache-cassandra-3.11.0-bin.tar.gz
tar xfz apache-cassandra-3.11.0-bin.tar.gz
sudo mv apache-cassandra-3.11.0 /opt/apache-cassandra-3.11.0

export CASSANDRA_HOME=/opt/apache-cassandra-3.11.0
export PATH=$PATH:$CASSANDRA_HOME/bin

cd /opt/apache-cassandra-3.11.0
cassandra
```

### Setting Up Cassandra on Mac OS X

The easiest way to do this is to use Hombrew.

```sh
brew install cassandra
brew services start cassandra
```

### First Casssandra Migration

After installing a fresh copy of Cassandra, you will need to run the DDL initialization statements in:

```sh
curl -O https://raw.githubusercontent.com/CatalystCode/fortisdeploy/master/ops/storage-ddls/cassandra-setup.cql
cqlsh < cassandra-setup.cql
```
