package com.microsoft.partnercatalyst.fortis.spark.logging

import java.io.{PrintWriter, StringWriter}
import java.util

import com.microsoft.applicationinsights.telemetry.{Duration, SeverityLevel}
import com.microsoft.applicationinsights.{TelemetryClient, TelemetryConfiguration}

class AppInsightsTelemetry extends FortisTelemetry {
  private val client: TelemetryClient = new TelemetryClient(TelemetryConfiguration.createDefault())

  def logDebug(trace: String): Unit = logTrace(trace, SeverityLevel.Verbose)

  def logInfo(trace: String): Unit = logTrace(trace, SeverityLevel.Information)

  def logError(trace: String, exception: Throwable): Unit = logTrace(trace, SeverityLevel.Error, Option(exception))

  private def logTrace(trace: String, level: SeverityLevel, exception: Option[Throwable]=None): Unit = {
    try {
      val message = exception match {
        case Some(error) =>
          val stringWriter = new StringWriter()
          error.printStackTrace(new PrintWriter(stringWriter))
          val stackTrace = stringWriter.toString
          s"$trace\n$stackTrace"
        case None =>
          trace
      }

      System.err.println(s"[$level] $message")

      client.trackTrace(message, level)
      client.flush()
    } catch {
      case exception: Exception =>
        System.err.println(s"Unable to send trace $trace to AppInsights")
        exception.printStackTrace(System.err)
    }
  }

  def logEvent(name: String, properties: Map[String, String]=Map(), metrics: Map[String, Double]=Map()): Unit = {
    try {
      System.err.println(s"Event $name|Properties ${properties.map(kv => s"${kv._1}=${kv._2}").mkString(",")}|Metrics ${metrics.map(kv => s"${kv._1}=${kv._2}").mkString(",")}")

      val appInsightsProperties = new util.HashMap[String, String](properties.size)
      properties.foreach(kv => appInsightsProperties.put(kv._1, kv._2))

      val appInsightsMetrics = new util.HashMap[String, java.lang.Double](metrics.size)
      metrics.foreach(kv => appInsightsMetrics.put(kv._1, kv._2))

      client.trackEvent(name, appInsightsProperties, appInsightsMetrics)
      client.flush()
    } catch {
      case exception: Exception =>
        System.err.println(s"Unable to send event $name to AppInsights")
        exception.printStackTrace(System.err)
    }
  }

  def logDependency(name: String, method: String, success: Boolean, durationInMs: Long): Unit = {
    try {
      System.err.println(s"Dependency $name|Method $method|Success $success|DurationInMs $durationInMs")

      client.trackDependency(name, method, new Duration(durationInMs), success)
      client.flush()
    } catch {
      case exception: Exception =>
        System.err.println(s"Unable to send dependency $name to AppInsights")
        exception.printStackTrace(System.err)
    }
  }
}