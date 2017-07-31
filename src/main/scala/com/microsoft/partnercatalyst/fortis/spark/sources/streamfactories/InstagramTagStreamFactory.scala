package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.github.catalystcode.fortis.spark.streaming.instagram.dto.InstagramItem
import com.github.catalystcode.fortis.spark.streaming.instagram.{InstagramAuth, InstagramUtils}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.{ConnectorConfig, StreamFactory}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

class InstagramTagStreamFactory extends StreamFactory[InstagramItem]{
  /**
    * Creates a DStream for a given connector config iff the connector config is supported by the stream factory.
    * The param set allows the streaming context to be curried into the partial function which creates the stream.
    *
    * @param streamingContext The Spark Streaming Context
    * @return A partial function for transforming a connector config
    */
  override def createStream(streamingContext: StreamingContext): PartialFunction[ConnectorConfig, DStream[InstagramItem]] = {
    case ConnectorConfig("InstagramTag", params) =>
      import ParameterExtensions._

      val auth = InstagramAuth(params.getAs[String]("authToken"))
      InstagramUtils.createTagStream(streamingContext, auth, params.getAs[String]("tag"))
  }
}