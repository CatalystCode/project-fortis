package com.microsoft.partnercatalyst.fortis.spark

object Constants {
  val SparkAppName = "project-fortis-spark"
  val SparkMasterDefault = "local[*]"
  val SparkStreamingBatchSizeDefault = 5

  val EventHubProgressDir = "eventhubProgress"
  val ContextStopWaitTimeMillis = 5000
  val PipeplineInitWaitTimeMillis = 5000

  object Env {
    val SparkStreamingBatchSize = "FORTIS_STREAMING_DURATION_IN_SECONDS"
    val HighlyAvailableProgressDir = "HA_PROGRESS_DIR"
    val AppInsightsKey = "APPLICATION_INSIGHTS_IKEY"
    val LanguageModelDir = "FORTIS_MODELS_DIRECTORY"
    val FeatureServiceUrlBase = "FORTIS_FEATURE_SERVICE_HOST"
    val BlobUrlBase = "FORTIS_CENTRAL_ASSETS_HOST"
    val CassandraHost = "FORTIS_CASSANDRA_HOST"
    val ManagementBusConnectionString = "FORTIS_SB_CONN_STR"
    val ManagementBusConfigQueueName = "FORTIS_SB_CONFIG_QUEUE"
    val ManagementBusCommandQueueName = "FORTIS_SB_COMMAND_QUEUE"
    val ContextStopWaitTimeMillis = "FORTIS_CONTEXT_STOP_WAIT_TIME_MILLIS"
    val PipeplineInitWaitTimeMillis = "FORTIS_PIPELINE_INIT_WAIT_TIME_MILLIS"
  }
}
