package com.github.catalystcode.fortis.spark.streaming.streamfactories

import com.github.catalystcode.fortis.spark.streaming.streamprovider.{ConnectorConfig, StreamFactory}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream
import org.apache.spark.streaming.eventhubs.EventHubsUtils

import scala.reflect.ClassTag

class EventHubStreamFactory[A: ClassTag](
    progressDir: String,
    adapter: Array[Byte] => A)
  extends StreamFactory[A] {

  override def createStream(streamingContext: StreamingContext): PartialFunction[ConnectorConfig, DStream[A]] = {
    case ConnectorConfig("EventHub", params) =>
      EventHubsUtils.createDirectStreams(
        streamingContext,
        params("namespace"),
        progressDir,
        Map(params("name") -> Map[String, String] (
          "eventhubs.policyname" -> params("policyName"),
          "eventhubs.policykey" -> params("policyKey"),
          "eventhubs.namespace" -> params("namespace"),
          "eventhubs.name" -> params("name"),
          "eventhubs.partition.count" -> params("partitionCount"),
          "eventhubs.consumergroup" -> params("consumerGroup")
        ))
      ).map(_.getBytes).map(adapter)
  }
}
