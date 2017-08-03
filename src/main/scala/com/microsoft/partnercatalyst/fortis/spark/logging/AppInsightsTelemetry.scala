package com.microsoft.partnercatalyst.fortis.spark.logging

import com.microsoft.applicationinsights.{TelemetryClient, TelemetryConfiguration}
import java.util.HashMap

class AppInsightsTelemetry extends FortisTelemetry {
  private val client: TelemetryClient = new TelemetryClient(TelemetryConfiguration.createDefault())

  def logIncomingEventBatch(streamId: String, connectorName: String, batchSize: Int): Unit = {
    val properties = new HashMap[String, String](2)
    properties.put("streamId", streamId)
    properties.put("connectorName", connectorName)

    val metrics = new HashMap[String, java.lang.Double](1)
    metrics.put("batchSize", batchSize.toDouble)

    client.trackEvent("process.events", properties, metrics)
  }

}