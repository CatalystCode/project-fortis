package com.microsoft.partnercatalyst.fortis.spark.logging

trait FortisTelemetry {
  def logEventBatchAggregation(duration: Long, batchSize: Long): Unit
  def logIncomingEventBatch(streamId: String, connectorName: String, batchSize: Long): Unit
}

object FortisTelemetry {
  private lazy val telemetry: FortisTelemetry = new AppInsightsTelemetry()

  def get(): FortisTelemetry = telemetry
}