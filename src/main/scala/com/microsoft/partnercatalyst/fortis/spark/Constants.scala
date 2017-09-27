package com.microsoft.partnercatalyst.fortis.spark

object Constants {
  val SparkAppName = "project-fortis-spark"
  val SparkMasterDefault = "local[*]"
  val SparkStreamingBatchSizeDefault = 30

  val EventHubProgressDir = "eventhubProgress"
  val SscInitRetryAfterMillis = 60*1000
  val SscShutdownDelayMillis = 60*1000

  val maxKeywordsPerEventDefault = 5
  val maxLocationsPerEventDefault = 4

  object Env {
    val SparkStreamingBatchSize = "FORTIS_STREAMING_DURATION_IN_SECONDS"
    val HighlyAvailableProgressDir = "HA_PROGRESS_DIR"
    val AppInsightsKey = "APPINSIGHTS_INSTRUMENTATIONKEY"
    val LanguageModelDir = "FORTIS_MODELS_DIRECTORY"
    val FeatureServiceUrlBase = "FORTIS_FEATURE_SERVICE_HOST"
    val BlobUrlBase = "FORTIS_CENTRAL_ASSETS_HOST"
    val CassandraHost = "FORTIS_CASSANDRA_HOST"
    val ManagementBusConnectionString = "FORTIS_SB_CONN_STR"
    val ManagementBusConfigQueueName = "FORTIS_SB_CONFIG_QUEUE"
    val ManagementBusCommandQueueName = "FORTIS_SB_COMMAND_QUEUE"
    val SscInitRetryAfterMillis = "FORTIS_SSC_INIT_RETRY_AFTER_MILLIS"
    val SscShutdownDelayMillis = "FORTIS_SSC_SHUTDOWN_DELAY_MILLIS"
    val MaxKeywordsPerEvent = "FORTIS_EVENT_MAX_KEYWORDS"
    val MaxLocationsPerEvent = "FORTIS_EVENT_MAX_LOCATIONS"
  }
}
