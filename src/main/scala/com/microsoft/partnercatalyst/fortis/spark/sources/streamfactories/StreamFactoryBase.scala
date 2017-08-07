package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.microsoft.partnercatalyst.fortis.spark.logging.FortisTelemetry
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.{ConnectorConfig, StreamFactory}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

import scala.reflect.ClassTag

abstract class StreamFactoryBase[A: ClassTag] extends StreamFactory[A]{
  override def createStream(ssc: StreamingContext): PartialFunction[ConnectorConfig, DStream[A]] = {
    case config if canHandle(config) =>
      val stream = buildStream(ssc, config)

      stream.transform(rdd => {
        rdd.cache()
        val batchSize = rdd.count().toInt
        val streamId = config.parameters.get("streamId").get.toString
        val connectorName = config.name
        val telemetry = FortisTelemetry.get()
        telemetry.logIncomingEventBatch(streamId, connectorName, batchSize)

        rdd
      })
  }

  protected def canHandle(connectorConfig: ConnectorConfig): Boolean
  protected def buildStream(ssc: StreamingContext, connectorConfig: ConnectorConfig): DStream[A]
}
