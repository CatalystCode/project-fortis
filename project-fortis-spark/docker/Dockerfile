FROM cwolff/spark

RUN apt-get -qq install -y --no-install-recommends wget ca-certificates && \
    wget -q http://www-eu.apache.org/dist/cassandra/3.11.0/apache-cassandra-3.11.0-bin.tar.gz && \
    tar xfz apache-cassandra-3.11.0-bin.tar.gz && \
    rm apache-cassandra-3.11.0-bin.tar.gz && \
    mv apache-cassandra-3.11.0 /opt/cassandra

ADD src /app/src
ADD lib /app/lib
ADD project /app/project
ADD build.sbt /app/build.sbt

RUN cd /app && \
    echo 'version := "0.0.0"' > version.sbt && \
    FORTIS_INTEGRATION_TESTS="true" JAVA_OPTS="-Xmx2048M" sbt assembly && \
    cd -

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
ENV FORTIS_CASSANDRA_HOST="localhost"
ENV FORTIS_CASSANDRA_PORT="9042"
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
