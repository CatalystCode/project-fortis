FROM ubuntu:xenial

# install cassandra
ENV CASSANDRA_HOME="/opt/cassandra"
ARG CASSANDRA_VERSION="3.11.0"
ARG CASSANDRA_ARTIFACT="apache-cassandra-${CASSANDRA_VERSION}"
ARG CASSANDRA_URL="http://archive.apache.org/dist/cassandra/${CASSANDRA_VERSION}/${CASSANDRA_ARTIFACT}-bin.tar.gz"
RUN apt-get update && \
    apt-get -qq install -y --no-install-recommends wget ca-certificates python && \
    wget -qO - ${CASSANDRA_URL} | tar -xzC /opt && \
    ln -s /opt/${CASSANDRA_ARTIFACT} ${CASSANDRA_HOME}

RUN apt-get -qq update && \
    apt-get -qq install -y libssl-dev libffi-dev python-dev curl apt-transport-https && \
    echo "deb [arch=amd64] https://packages.microsoft.com/repos/azure-cli/ xenial main" | tee /etc/apt/sources.list.d/azure-cli.list && \
    curl -L https://packages.microsoft.com/keys/microsoft.asc | apt-key add - && \
    apt-get -qq update && \
    apt-get -qq install -y azure-cli

# install app dependencies
RUN apt-get -qq install -y cron gzip

# install backup scripts
ADD backup-cassandra-keyspace.sh /app/backup-cassandra-keyspace.sh
ADD docker/run-cqlsh.sh /app/cqlsh
ADD docker/run-backup.sh /app/backup

CMD /app/backup

# configuration for azure blob account where backups are stored
ENV USER_FILES_BLOB_ACCOUNT_NAME=""
ENV USER_FILES_BLOB_ACCOUNT_KEY=""
ENV BACKUP_CONTAINER_NAME="backups"
ENV BACKUP_DELETE_LOOKBACK="2 weeks ago"
ENV BACKUP_INTERVAL="2h"

# a one-node local cassandra is set up via docker-compose, if you wish to use a
# larger cluster (e.g. hosted in Azure), just override this variable with the
# hostname of your cluster
ENV FORTIS_CASSANDRA_HOST="cassandra"
ENV FORTIS_CASSANDRA_PORT="9042"
ENV FORTIS_CASSANDRA_USERNAME="cassandra"
ENV FORTIS_CASSANDRA_PASSWORD="cassandra"
