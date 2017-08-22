package com.microsoft.partnercatalyst.fortis.spark

object Constants {
  val SparkAppName = "project-fortis-spark"
  val SparkMasterDefault = "local[*]"
  val SparkStreamingBatchSizeDefault = 5

  val EventHubProgressDir = "eventhubProgress"
  val SscShutdownDelayMillis = 60000
  val SscInitRetryAfterMillis = 5000

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
    val SscShutdownDelayMillis = "FORTIS_SSC_SHUTDOWN_DELAY_MILLIS"
    val SscInitRetryAfterMillis = "FORTIS_SSC_INIT_RETRY_AFTER_MILLIS"
  }
}
