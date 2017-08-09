package com.microsoft.partnercatalyst.fortis.spark

object Constants {
  val SparkAppName = "project-fortis-spark"
  val SparkMasterDefault = "local[*]"
  val SparkStreamingBatchSizeDefault = 1

  val EventHubProgressDir = "eventhubProgress"

  object Env {
    val HighlyAvailableProgressDir = "HA_PROGRESS_DIR"
    val AppInsightsKey = "FORTIS_APPINSIGHTS_IKEY"
    val LanguageModelDir = "FORTIS_MODELS_DIRECTORY"
    val FeatureServiceUrlBase = "FORTIS_FEATURE_SERVICE_HOST"
    val BlobUrlBase = "FORTIS_CENTRAL_ASSETS_HOST"
    val CassandraHost = "FORTIS_CASSANDRA_HOST"
    val ManagementBusNamespace = "FORTIS_SERVICEBUS_NAMESPACE"
    val ManagementBusConfigQueueName = "FORTIS_SERVICEBUS_CONFIG_QUEUE"
    val ManagementBusPolicyName = "FORTIS_SERVICEBUS_POLICY_NAME"
    val ManagementBusPolicyKey = "FORTIS_SERVICEBUS_POLICY_KEY"
  }
}
