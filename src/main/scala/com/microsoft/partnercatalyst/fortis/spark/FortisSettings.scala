package com.microsoft.partnercatalyst.fortis.spark

case class FortisSettings(
  progressDir: String,
  featureServiceUrlBase: String,
  blobUrlBase: String,
  cassandraHosts: String,
  contextStopWaitTimeMillis: Long,
  managementBusConnectionString: String,
  managementBusConfigQueueName: String,
  managementBusCommandQueueName: String,
  appInsightsKey: Option[String],
  pipelineInitWaitTimeMillis: Long,
  modelsDir: Option[String]
)