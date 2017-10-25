# Environment
This document outlines the steps required to properly configure a complete Project Fortis development environment.

## Dependencies
The following external components are required in order to run and debug Fortis:

| Component | Description |
| --- | --- |
| Cassandra instance | Stores configuration data as well as the processed event information which powers the Fortis UI. |
| Azure Service Bus | Two queues are required: The `Command` queue is used to trigger Spark pipeline restarts, while the `Configuration` queue is used to trigger live rollouts of updated configuration data to running Spark jobs. |
| Azure App Insights | An Application Insights instance used to log telemetry/statistics, debug traces and exceptions in Azure.  If omitted, debug traces as well as exceptions will still be written to `stdout`, but telemetry will not be reported. *(optional)* |

## Environment Variables
The following environment variables should be defined when running/debugging Fortis's components. All variables are required unless otherwise noted:

| Variable | Default | Description|
| --- | --- | --- |
| `APPINSIGHTS_INSTRUMENTATIONKEY` | None | The instrumentation key corresponding to the app insights resource to which logs and telemetry should be written in Azure. |
| `FORTIS_CASSANDRA_HOST` | *Required* | The IP address of the Cassandra instance (see dependencies above). This will likely be `localhost` if you're running locally |
| `FORTIS_CENTRAL_ASSETS_HOST` | [[Hyperlink]](https://fortiscentral.blob.core.windows.net) | Central asset host for language models, etc. |
| `FORTIS_EVENT_MAX_KEYWORDS` | `5` | The maximum number of keywords with which an event will be tagged. *This parameter has an exponential relationship with the amount of event data stored in Cassandra. Increase with caution.* |
| `FORTIS_EVENT_MAX_LOCATIONS` | `4` | The maximum number of locations with which an event will be tagged. *This parameter has an exponential relationship with the amount of event data stored in Cassandra. Increase with caution.* |
| `FORTIS_FEATURE_SERVICE_HOST` | *Required* | The URI of the feature service which is used to infer geographic coordinates from the names of locations, such as cities. To use the standard feature service, set this to [[Hyperlink]](http://fortis-features.eastus.cloudapp.azure.com). |
| `FORTIS_MODELS_DIRECTORY` | | |
| `FORTIS_SB_COMMAND_QUEUE` | | |
| `FORTIS_SB_CONFIG_QUEUE` | | |
| `FORTIS_SB_CONN_STR` | | |
| `FORTIS_SSC_INIT_RETRY_AFTER_MILLIS` | | |
| `FORTIS_SSC_SHUTDOWN_DELAY_MILLIS` | | |
| `FORTIS_STREAMING_DURATION_IN_SECONDS` | | |
| `HA_PROGRESS_DIR` | | |
