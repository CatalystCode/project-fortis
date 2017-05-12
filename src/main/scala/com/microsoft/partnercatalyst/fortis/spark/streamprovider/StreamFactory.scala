package com.microsoft.partnercatalyst.fortis.spark.streamprovider

import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

/**
  * Provides an interface for concrete stream factory definitions, which encapsulate the logic of creating a DStream
  * backed by a specific type of connector (i.e. Kafka, EventHub, Instagram), given a configuration bundle (config).
  * @tparam A The element type of the streams produced by this factory.
  */
trait StreamFactory[A] {
  /**
    * Creates a DStream for a given connector config iff the connector config is supported by the stream factory.
    * The param set allows the streaming context to be curried into the partial function which creates the stream.
    * @param streamingContext The Spark Streaming Context
    * @return A partial function for transforming a connector config
    */
  def createStream(streamingContext: StreamingContext) : PartialFunction[ConnectorConfig, DStream[A]]
}