# Environment
This document outlines the steps required to properly configure a complete Project Fortis development environment.

## Dependencies
The following external components are required in order to run and debug Fortis:

| Component | Description |
| --- | --- |
| Cassandra instance | Stores configuration data as well as the processed event information which powers the Fortis UI. See [Cassandra Setup](cassandra-setup.md) for detailed setup instructions.  |
| Azure Service Bus | Two queues are required: The `Command` queue is used to trigger Spark pipeline restarts, while the `Configuration` queue is used to trigger live rollouts of updated configuration data to running Spark jobs. |
| Azure App Insights *(optional)* | An Application Insights instance used to log telemetry/statistics, debug traces and exceptions in Azure.  If omitted, debug traces as well as exceptions will still be written to `stdout`, but telemetry will not be reported. |

## Environment Variables
The following environment variables should be defined when running/debugging Fortis's components. Some optional variable must be defined in order to enable some scenarios (i.e. checkpointing).

### Required
| Variable | Description|
| --- | --- |
| `FORTIS_CASSANDRA_HOST` | The IP address of the Cassandra instance (see dependencies above). This will likely be `localhost` if you're running locally |
| `FORTIS_FEATURE_SERVICE_HOST` | The URI of the feature service which is used to infer geographic coordinates from the names of locations, such as cities. To use the standard feature service, set this to [[Hyperlink]](http://fortis-features.eastus.cloudapp.azure.com). |
| `FORTIS_SB_COMMAND_QUEUE` | The Azure Service Bus Queue name of the queue to which requests to restart the Spark data pipeline will be sent. In cluster deployments, this is set to `command`. |
| `FORTIS_SB_CONFIG_QUEUE` | The Azure Service Bus Queue name of the queue to which configuration changes are sent to the Spark pipeline. In cluster deployments, this is set to `configuration`. |
| `FORTIS_SB_CONN_STR` | The Azure Service Bus connection string for the resource which hosts the above queues. |

### Optional
| Variable | Default | Description|
| --- | --- | --- |
| `APPINSIGHTS_INSTRUMENTATIONKEY` | None | The instrumentation key corresponding to the app insights resource to which logs and telemetry should be written in Azure. |
| `FORTIS_CENTRAL_ASSETS_HOST` | [[Hyperlink]](https://fortiscentral.blob.core.windows.net) | Central asset host for language models, etc. |
| `FORTIS_EVENT_MAX_KEYWORDS` | `5` | The maximum number of keywords with which an event will be tagged. </p>** *This parameter has an exponential relationship with the amount of event data stored in Cassandra. Increase with caution.* |
| `FORTIS_EVENT_MAX_LOCATIONS` | `4` | The maximum number of locations with which an event will be tagged. </p>** *This parameter has an exponential relationship with the amount of event data stored in Cassandra. Increase with caution.* |
| `FORTIS_SSC_INIT_RETRY_AFTER_MILLIS` | `60000` | On start or restart, the Spark pipeline will query the Cassandra instance for stream connection data (used to open user-defined data source streams). If no streams have been defined, the Spark pipeline will continually retry on this interval. |
| `FORTIS_SSC_SHUTDOWN_DELAY_MILLIS` | `60000` | Upon receiving a restart request over the command queue, the Spark pipeline will execute a shutdown of the current Streaming context only after this delay has elapsed. This is used to consolidate restart requests which arrive in quick succession.  |
| `FORTIS_STREAMING_DURATION_IN_SECONDS` | `30` | The Spark Streaming batch interval at which data is ingested by the Spark pipeline. New processed event data will be available in the Fortis UI each time this interval rolls over, so it can be decreased in order to better approximate real-time processing. </p> ** *The pipeline must be able to process all data arriving at the start of this window by its end. Otherwise, the pipeline will not be stable (and will run out of memory). The [Spark UI](monitoring.md#spark-ui) can be used to determine if the configured interval can be sustained under the data volume.*
| `HA_PROGRESS_DIR` | None | The highly available directory to use for checkpoint data. This directory must be accesible via the same path on all cluster nodes. In a cluster deployment, and Azure storage share is used to satisfy this requirement. If unspecified (default), checkpointing is disabled. </p>** *In order to use EventHub-based streams (i.e. Tada Web), this must be defined.* |
