package com.microsoft.partnercatalyst.fortis.spark.logging

trait FortisTelemetry {
  def logIncomingEventBatch(streamId: String, connectorName: String, batchSize: Long): Unit
  def logCassandraEventsSink(duration: Long, batchSize: Long): Unit
}

object FortisTelemetry {
  private lazy val telemetry: FortisTelemetry = new AppInsightsTelemetry()

  def get(): FortisTelemetry = telemetry
}