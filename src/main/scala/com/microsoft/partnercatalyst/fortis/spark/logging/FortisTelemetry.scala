package com.microsoft.partnercatalyst.fortis.spark.logging

trait FortisTelemetry {
  def logIncomingEventBatch(streamId: String, connectorName: String, batchSize: Long): Unit
  def logSink(eventName: String, duration: Long, batchSize: Long): Unit
  def logLanguageDetection(language: Option[String]): Unit
}

object FortisTelemetry {
  private lazy val telemetry: FortisTelemetry = new AppInsightsTelemetry()

  def get(): FortisTelemetry = telemetry
}