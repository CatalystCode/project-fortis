package com.microsoft.partnercatalyst.fortis.spark.logging

import java.util

import com.microsoft.applicationinsights.telemetry.Duration
import com.microsoft.applicationinsights.{TelemetryClient, TelemetryConfiguration}

class AppInsightsTelemetry extends FortisTelemetry {
  private val client: TelemetryClient = new TelemetryClient(TelemetryConfiguration.createDefault())

  def logEvent(name: String, properties: Map[String, String]=Map(), metrics: Map[String, Double]=Map()): Unit = {
    val appInsightsProperties = new util.HashMap[String, String](properties.size)
    properties.foreach(kv => appInsightsProperties.put(kv._1, kv._2))

    val appInsightsMetrics = new util.HashMap[String, java.lang.Double](metrics.size)
    metrics.foreach(kv => appInsightsMetrics.put(kv._1, kv._2))

    client.trackEvent(name, appInsightsProperties, appInsightsMetrics)
  }

  def logDependency(name: String, method: String, success: Boolean, durationInMs: Long): Unit = {
    client.trackDependency(name, method, new Duration(durationInMs), success)
  }
}