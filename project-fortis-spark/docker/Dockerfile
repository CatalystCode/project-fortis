FROM java:openjdk-8

# install cassandra
ENV CASSANDRA_HOME="/opt/cassandra"
ARG CASSANDRA_VERSION="3.11.0"
ARG CASSANDRA_ARTIFACT="apache-cassandra-${CASSANDRA_VERSION}"
ARG CASSANDRA_URL="http://archive.apache.org/dist/cassandra/${CASSANDRA_VERSION}/${CASSANDRA_ARTIFACT}-bin.tar.gz"
RUN apt-get -qq install -y --no-install-recommends wget ca-certificates && \
    wget -qO - ${CASSANDRA_URL} | tar -xzC /opt && \
    ln -s /opt/${CASSANDRA_ARTIFACT} ${CASSANDRA_HOME}

# install sbt and scala
ARG SCALA_VERSION="2.11.7"
ARG SBT_VERSION="0.13.13"
ARG SBT_ARTIFACT="sbt-${SBT_VERSION}.deb"
ARG SBT_URL="https://dl.bintray.com/sbt/debian/${SBT_ARTIFACT}"
RUN wget -q ${SBT_URL} && \
    dpkg -i ${SBT_ARTIFACT} && \
    rm ${SBT_ARTIFACT} && \
    apt-get -qq update && \
    apt-get -qq install -y sbt && \
    sbt ++${SCALA_VERSION} sbtVersion

# install spark
ENV SPARK_HOME="/opt/spark"
ARG SPARK_VERSION="2.2.0"
ARG SPARK_ARTIFACT="spark-${SPARK_VERSION}-bin-hadoop2.7"
ARG SPARK_URL="http://d3kbcqa49mib13.cloudfront.net/${SPARK_ARTIFACT}.tgz"
RUN wget -qO - ${SPARK_URL} | tar -xzC /opt && \
    ln -s /opt/${SPARK_ARTIFACT} ${SPARK_HOME} && \
    cp ${SPARK_HOME}/conf/log4j.properties.template ${SPARK_HOME}/conf/log4j.properties

ENV PATH="$JAVA_HOME/bin:$SPARK_HOME/bin:$SPARK_HOME/sbin:$PATH"
USER root
WORKDIR /root

# install streaming job
ADD src /app/src
ADD lib /app/lib
ADD project /app/project
ADD build.sbt /app/build.sbt
RUN cd /app && \
    echo 'version := "0.0.0"' > version.sbt && \
    FORTIS_INTEGRATION_TESTS="true" JAVA_OPTS="-Xmx4096M" sbt ++${SCALA_VERSION} assembly && \
    find /app/target -name '*-assembly-0.0.0.jar' -exec mv {} /app/job.jar \; -quit && \
    rm -rf /app/target && \
    rm -rf $HOME/.ivy2 && \
    cd -

# install tools
ADD docker/run-spark.sh /app/spark
ADD docker/run-cqlsh.sh /app/cqlsh
CMD /app/spark

# access keys for azure resources
ENV APPINSIGHTS_INSTRUMENTATIONKEY=""
ENV APPLICATION_INSIGHTS_IKEY=""
ENV FORTIS_SB_CONN_STR=""

# these settings need to be in sync with project-fortis-services
ENV FORTIS_SB_CONFIG_QUEUE="configuration"
ENV FORTIS_SB_COMMAND_QUEUE="command"

# root url for downloading opener model files
ENV FORTIS_CENTRAL_ASSETS_HOST="https://fortiscentral.blob.core.windows.net"

# a one-node local cassandra is set up via docker-compose, if you wish to use a
# larger cluster (e.g. hosted in Azure), just override this variable with the
# hostname of your cluster
ENV FORTIS_CASSANDRA_HOST="cassandra"
ENV FORTIS_CASSANDRA_PORT="9042"
ENV FORTIS_CASSANDRA_USERNAME="cassandra"
ENV FORTIS_CASSANDRA_PASSWORD="cassandra"

# configuration for the aggregations to cassandra
# setting higher values for these will exponentially increase the write load to
# the database since there's a combinatorial explosion happening under the hood
ENV FORTIS_EVENT_MAX_KEYWORDS="5"
ENV FORTIS_EVENT_MAX_LOCATIONS="4"

# deployment of https://github.com/CatalystCode/featureService
# a local instance backed by Azure PostgreSQL DB gets set up via docker-compose
ENV FORTIS_FEATURE_SERVICE_HOST="http://featureservice"

# configuration for spark and monitoring web interfaces
# - spark-context 4040
# - spark-master on 8080
# - spark-worker on 8081
ENV SPARK_MAINCLASS="com.microsoft.partnercatalyst.fortis.spark.ProjectFortis"
ENV SPARK_DRIVER_MEMORY="4g"
ENV HA_PROGRESS_DIR=""
ENV FORTIS_STREAMING_DURATION_IN_SECONDS="30"
ENV FORTIS_SSC_INIT_RETRY_AFTER_MILLIS="60000"
ENV FORTIS_SSC_SHUTDOWN_DELAY_MILLIS="60000"
EXPOSE 4040 8080 8081
