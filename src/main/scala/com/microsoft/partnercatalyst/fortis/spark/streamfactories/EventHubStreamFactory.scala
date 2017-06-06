package com.microsoft.partnercatalyst.fortis.spark.streamfactories

import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamFactory}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream
import org.apache.spark.streaming.eventhubs.EventHubsUtils

import java.nio.charset.StandardCharsets
import scala.language.implicitConversions
import scala.reflect.ClassTag
import scala.util.{Failure, Success, Try}

class EventHubStreamFactory[A: ClassTag](identifier: String, adapter: (Array[Byte]) => Try[A], progressDir: String)
  extends StreamFactory[A] {

  override def createStream(streamingContext: StreamingContext): PartialFunction[ConnectorConfig, DStream[A]] = {
    case ConnectorConfig(`identifier`, params) =>

      // Copy adapter ref locally to avoid serializing entire EventHubStreamFactory instance
      val adapter_ = adapter

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
      ).map(_.getBytes).flatMap(adapter_(_) match {
        case Success(event) => Some(event)
        case Failure(ex) => {
          // TODO: log that we're skipping failed conversion to A
          None
        }
      })
  }
}

object EventHubStreamFactory {
  implicit def utf8ToString[A](in: String => Try[A]): Array[Byte] => Try[A] =
    utf8Bytes => in(new String(utf8Bytes, StandardCharsets.UTF_8))
}