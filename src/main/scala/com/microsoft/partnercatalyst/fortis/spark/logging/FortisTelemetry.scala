package com.microsoft.partnercatalyst.fortis.spark.logging

trait FortisTelemetry {
  def logIncomingEventBatch(streamId: String, connectorName: String, batchSize: Int)
}

object FortisTelemetry {
  private lazy val telemetry: FortisTelemetry = new AppInsightsTelemetry()

  def get(): FortisTelemetry = telemetry
}