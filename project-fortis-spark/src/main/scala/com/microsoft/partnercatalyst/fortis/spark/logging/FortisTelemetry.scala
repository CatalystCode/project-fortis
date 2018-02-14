package com.microsoft.partnercatalyst.fortis.spark.logging

trait FortisTelemetry {
  def logDebug(trace: String): Unit
  def logInfo(trace: String): Unit
  def logError(trace: String, exception: Throwable=null): Unit
  def logEvent(name: String, properties: Map[String, String]=Map(), metrics: Map[String, Double]=Map()): Unit
  def logDependency(name: String, method: String, success: Boolean, durationInMs: Long)
}

object FortisTelemetry {
  private lazy val telemetry: FortisTelemetry = new AppInsightsTelemetry()

  def get: FortisTelemetry = telemetry
}