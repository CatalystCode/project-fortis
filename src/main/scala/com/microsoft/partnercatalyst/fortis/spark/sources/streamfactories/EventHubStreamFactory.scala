package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import java.nio.charset.StandardCharsets

import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.{ConnectorConfig, StreamFactory}
import org.apache.log4j.LogManager
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream
import org.apache.spark.streaming.eventhubs.EventHubsUtils

import scala.language.implicitConversions
import scala.reflect.ClassTag
import scala.util.{Failure, Success, Try}

class EventHubStreamFactory[A: ClassTag](identifier: String, adapter: (Array[Byte]) => Try[A], progressDir: String)
  extends StreamFactory[A] {

  override def createStream(streamingContext: StreamingContext): PartialFunction[ConnectorConfig, DStream[A]] = {
    case ConnectorConfig(`identifier`, params) =>

      // Copy adapter ref locally to avoid serializing entire EventHubStreamFactory instance
      val adapter_ = adapter
      val className_ = getClass.getName

      EventHubsUtils.createDirectStreams(
        streamingContext,
        params("namespace"),
        progressDir,
        Map(params("name") -> Map(
          "eventhubs.policyname" -> params("policyName"),
          "eventhubs.policykey" -> params("policyKey"),
          "eventhubs.namespace" -> params("namespace"),
          "eventhubs.name" -> params("name"),
          "eventhubs.partition.count" -> params("partitionCount"),
          "eventhubs.consumergroup" -> params("consumerGroup")
        ))
      ).map(_.getBytes).flatMap(adapter_(_) match {
        case Success(event) => Some(event)
        case Failure(ex) =>
          LogManager.getLogger(className_).error("Unable to parse EventHub message", ex)
          None
      })
  }
}

object EventHubStreamFactory {
  implicit def utf8ToString[A](in: String => Try[A]): Array[Byte] => Try[A] =
    utf8Bytes => in(new String(utf8Bytes, StandardCharsets.UTF_8))
}