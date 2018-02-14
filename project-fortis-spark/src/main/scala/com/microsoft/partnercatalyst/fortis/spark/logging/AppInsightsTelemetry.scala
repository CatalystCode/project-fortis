package com.microsoft.partnercatalyst.fortis.spark.logging

import java.io.{PrintWriter, StringWriter}
import java.util

import com.microsoft.applicationinsights.telemetry.{Duration, SeverityLevel}
import com.microsoft.applicationinsights.{TelemetryClient, TelemetryConfiguration}

class AppInsightsTelemetry extends FortisTelemetry {
  private val client: TelemetryClient = new TelemetryClient(TelemetryConfiguration.createDefault())

  def logDebug(trace: String): Unit = logTrace(trace, SeverityLevel.Verbose)

  def logInfo(trace: String): Unit = logTrace(trace, SeverityLevel.Information)

  def logError(trace: String, exception: Throwable): Unit = {
    val stackTrace = if (exception != null) {
      val stringWriter = new StringWriter()
      exception.printStackTrace(new PrintWriter(stringWriter))
      stringWriter.toString
    } else {
      ""
    }

    logTrace(s"$trace\n$stackTrace", SeverityLevel.Error)
  }

  private def logTrace(trace: String, level: SeverityLevel): Unit = {
    System.err.println(s"[$level] $trace")
    client.trackTrace(trace, level)
    client.flush()
  }

  def logEvent(name: String, properties: Map[String, String]=Map(), metrics: Map[String, Double]=Map()): Unit = {
    val appInsightsProperties = new util.HashMap[String, String](properties.size)
    properties.foreach(kv => appInsightsProperties.put(kv._1, kv._2))

    val appInsightsMetrics = new util.HashMap[String, java.lang.Double](metrics.size)
    metrics.foreach(kv => appInsightsMetrics.put(kv._1, kv._2))

    client.trackEvent(name, appInsightsProperties, appInsightsMetrics)
    client.flush()
  }

  def logDependency(name: String, method: String, success: Boolean, durationInMs: Long): Unit = {
    client.trackDependency(name, method, new Duration(durationInMs), success)
    client.flush()
  }
}