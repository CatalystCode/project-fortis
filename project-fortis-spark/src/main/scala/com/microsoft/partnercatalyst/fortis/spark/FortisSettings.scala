package com.microsoft.partnercatalyst.fortis.spark

case class FortisSettings(
  progressDir: String,
  featureServiceUrlBase: String,
  blobUrlBase: String,
  cassandraHosts: String,
  managementBusConnectionString: String,
  managementBusConfigQueueName: String,
  managementBusCommandQueueName: String,
  appInsightsKey: Option[String],
  sscInitRetryAfterMillis: Long,
  sscShutdownDelayMillis: Long,
  maxKeywordsPerEvent: Int,
  maxLocationsPerEvent: Int
)