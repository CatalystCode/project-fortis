package com.microsoft.partnercatalyst.fortis.spark

case class FortisSettings(
  progressDir: String,
  featureServiceUrlBase: String,
  blobUrlBase: String,
  cassandraHosts: String,
  managementBusNamespace: String,
  managementBusConfigQueueName: String,
  managementBusPolicyName: String,
  managementBusPolicyKey: String,
  appInsightsKey: Option[String],
  modelsDir: Option[String]
)