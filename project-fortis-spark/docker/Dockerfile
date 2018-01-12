# ------------------------------------------------------------------------------
#
# Dockerfile below adapted from https://hub.docker.com/r/p7hb/docker-spark/
#
# ------------------------------------------------------------------------------

FROM java:openjdk-8

# Scala related variables.
ARG SCALA_VERSION=2.12.2
ARG SCALA_BINARY_ARCHIVE_NAME=scala-${SCALA_VERSION}
ARG SCALA_BINARY_DOWNLOAD_URL=http://downloads.lightbend.com/scala/${SCALA_VERSION}/${SCALA_BINARY_ARCHIVE_NAME}.tgz

# SBT related variables.
ARG SBT_VERSION=0.13.15
ARG SBT_BINARY_ARCHIVE_NAME=sbt-$SBT_VERSION
ARG SBT_BINARY_DOWNLOAD_URL=https://dl.bintray.com/sbt/native-packages/sbt/${SBT_VERSION}/${SBT_BINARY_ARCHIVE_NAME}.tgz

# Spark related variables.
ARG SPARK_VERSION=2.2.0
ARG SPARK_BINARY_ARCHIVE_NAME=spark-${SPARK_VERSION}-bin-hadoop2.7
ARG SPARK_BINARY_DOWNLOAD_URL=http://d3kbcqa49mib13.cloudfront.net/${SPARK_BINARY_ARCHIVE_NAME}.tgz

# Configure env variables for Scala, SBT and Spark.
# Also configure PATH env variable to include binary folders of Java, Scala, SBT and Spark.
ENV SCALA_HOME       /usr/local/scala
ENV SBT_HOME         /usr/local/sbt
ENV SPARK_HOME       /usr/local/spark
ENV PATH             $JAVA_HOME/bin:$SCALA_HOME/bin:$SBT_HOME/bin:$SPARK_HOME/bin:$SPARK_HOME/sbin:$PATH

# Download, uncompress and move all the required packages and libraries to their corresponding directories in /usr/local/ folder.
RUN apt-get -yqq update && \
    apt-get install -yqq vim screen tmux && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /tmp/* && \
    wget -qO - ${SCALA_BINARY_DOWNLOAD_URL} | tar -xz -C /usr/local/ && \
    wget -qO - ${SBT_BINARY_DOWNLOAD_URL} | tar -xz -C /usr/local/  && \
    wget -qO - ${SPARK_BINARY_DOWNLOAD_URL} | tar -xz -C /usr/local/ && \
    cd /usr/local/ && \
    ln -s ${SCALA_BINARY_ARCHIVE_NAME} scala && \
    ln -s ${SPARK_BINARY_ARCHIVE_NAME} spark && \
    cp spark/conf/log4j.properties.template spark/conf/log4j.properties

# We will be running our Spark jobs as `root` user.
USER root

# Working directory is set to the home folder of `root` user.
WORKDIR /root

# Expose ports for monitoring.
# SparkContext web UI on 4040 -- only available for the duration of the application.
# Spark master’s web UI on 8080.
# Spark worker web UI on 8081.
EXPOSE 4040 8080 8081

# ------------------------------------------------------------------------------
#
# Only application-specific code follows below this point
#
# ------------------------------------------------------------------------------

RUN apt-get -qq install -y --no-install-recommends wget ca-certificates && \
    wget -q http://www-eu.apache.org/dist/cassandra/3.11.0/apache-cassandra-3.11.0-bin.tar.gz && \
    tar xfz apache-cassandra-3.11.0-bin.tar.gz && \
    rm apache-cassandra-3.11.0-bin.tar.gz && \
    mv apache-cassandra-3.11.0 /opt/cassandra

# access keys for azure resources
ENV APPINSIGHTS_INSTRUMENTATIONKEY="..."
ENV APPLICATION_INSIGHTS_IKEY="..."
ENV FORTIS_SB_CONN_STR="..."

# these settings need to be in sync with project-fortis-services
ENV FORTIS_SB_CONFIG_QUEUE="configuration"
ENV FORTIS_SB_COMMAND_QUEUE="command"

# root url for downloading opener model files
ENV FORTIS_CENTRAL_ASSETS_HOST="https://fortiscentral.blob.core.windows.net"

# a one-node local cassandra is set up via docker-compose, if you wish to use a
# larger cluster (e.g. hosted in Azure), just override this variable with the
# hostname of your cluster
ENV FORTIS_CASSANDRA_HOST="cassandra"
ENV FORTIS_CASSANDRA_USERNAME="cassandra"
ENV FORTIS_CASSANDRA_PASSWORD="cassandra"

# configuration for the aggregations to cassandra
# setting higher values for these will exponentially increase the write load to
# the database since there's a combinatorial explosion happening under the hood
ENV FORTIS_EVENT_MAX_KEYWORDS="5"
ENV FORTIS_EVENT_MAX_LOCATIONS="4"

# setting up the feature service is a lengthy process so we provide a shared
# instance for convenience; if you wish to run this service locally, please
# follow the instructions at https://github.com/CatalystCode/featureService and
# then update the value of this environment variable to http://localhost:3035
ENV FORTIS_FEATURE_SERVICE_HOST="http://fortis-features.eastus.cloudapp.azure.com"

# configuration for spark
ENV SPARK_MAINCLASS="com.microsoft.partnercatalyst.fortis.spark.ProjectFortis"
ENV SPARK_DRIVER_MEMORY="4g"
ENV HA_PROGRESS_DIR=""
ENV FORTIS_STREAMING_DURATION_IN_SECONDS="30"
ENV FORTIS_SSC_INIT_RETRY_AFTER_MILLIS="60000"
ENV FORTIS_SSC_SHUTDOWN_DELAY_MILLIS="60000"

# ensure that all tests get run
ENV FORTIS_INTEGRATION_TESTS="true"

ADD . /app
ADD docker/run-spark.sh /app/spark
ADD docker/run-cqlsh.sh /app/cqlsh

RUN cd /app && \
    echo 'version := "0.0.0"' > version.sbt && \
    JAVA_OPTS="-Xmx2048M" sbt assembly && \
    cd -

CMD /app/spark
