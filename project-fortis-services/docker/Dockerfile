FROM node:9.2.0

ADD . /app
ADD docker/run-node.sh /app/run-node.sh

WORKDIR /app

RUN apt-get install -y --no-install-recommends wget ca-certificates \
 && wget -q http://www-eu.apache.org/dist/cassandra/3.11.0/apache-cassandra-3.11.0-bin.tar.gz \
 && tar xfz apache-cassandra-3.11.0-bin.tar.gz \
 && rm apache-cassandra-3.11.0-bin.tar.gz \
 && mv apache-cassandra-3.11.0 /opt/cassandra \
 && npm install

ENV ENABLE_V2=1

# these settings need to be in sync with project-fortis-spark
ENV PUBLISH_EVENTS_EVENTHUB_PATH="published-messages"
ENV PUBLISH_EVENTS_EVENTHUB_PARTITION="\$Default"
ENV FORTIS_SB_CONFIG_QUEUE="configuration"
ENV FORTIS_SB_COMMAND_QUEUE="command"

# access keys for azure resources
ENV PUBLISH_EVENTS_EVENTHUB_CONNECTION_STRING="..."
ENV FORTIS_SB_CONN_STR="..."
ENV USER_FILES_BLOB_ACCOUNT_NAME="..."
ENV USER_FILES_BLOB_ACCOUNT_KEY="..."
ENV FACEBOOK_AUTH_TOKEN="..."
ENV APPINSIGHTS_INSTRUMENTATIONKEY="..."

# setting up the feature service is a lengthy process so we provide a shared
# instance for convenience; if you wish to run this service locally, please
# follow the instructions at https://github.com/CatalystCode/featureService and
# then update the value of this environment variable to http://localhost:3035
ENV FORTIS_FEATURE_SERVICE_HOST="http://fortis-features.eastus.cloudapp.azure.com"

# a one-node local cassandra is set up via docker-compose, if you wish to use a
# larger cluster (e.g. hosted in Azure), just override this variable with the
# hostname of your cluster
ENV CASSANDRA_CONTACT_POINTS="localhost"
ENV CASSANDRA_KEYSPACE="fortis"
ENV CASSANDRA_USERNAME="cassandra"
ENV CASSANDRA_PASSWORD="cassandra"
ENV FORTIS_CASSANDRA_REPLICATION_FACTOR="3"

# the cql file at this url is used to set up the initial schema for the
# cassandra database; you don't want to change this value unless you're
# developing a schema migration
ENV FORTIS_CASSANDRA_SCHEMA_URL="https://raw.githubusercontent.com/CatalystCode/project-fortis-pipeline/master/ops/storage-ddls/cassandra-setup.cql"

# the tar.gz file at this url is used to populate the cassandra database with
# initial test data; you never ever want to set this value in a production
# deployment since it would pollute the deployment with test data -- this is
# for developer convenience only
# the archive at the url is expected to contain an import.cql file which may
# reference other files in the archive, e.g. for cql `copy from` commands
ENV FORTIS_CASSANDRA_SEED_DATA_URL=""

EXPOSE 80
CMD "/app/run-node.sh"
