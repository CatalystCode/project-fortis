package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.github.catalystcode.fortis.spark.streaming.facebook.dto.FacebookPost
import com.github.catalystcode.fortis.spark.streaming.facebook.{FacebookAuth, FacebookUtils}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.{ConnectorConfig, StreamFactory}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

class FacebookPageStreamFactory extends StreamFactory[FacebookPost] {
  private final val DELIMITER: String = "|"

  /**
    * Creates a DStream for a given connector config iff the connector config is supported by the stream factory.
    * The param set allows the streaming context to be curried into the partial function that creates the stream.
    *
    * @param streamingContext The Spark Streaming Context
    * @return A partial function for transforming a connector config
    */
  override def createStream(streamingContext: StreamingContext): PartialFunction[ConnectorConfig, DStream[FacebookPost]] = {
    case ConnectorConfig("FacebookPage", params) =>
      val facebookAuth = FacebookAuth(params("appId"), params("appSecret"), params("accessToken"))
      val pageIds = Option(params("pageIds")) match {
        case None => Set()
        case Some(pageIds) => pageIds.split(DELIMITER).toSet
      }

      FacebookUtils.createPageStreams(streamingContext, facebookAuth, pageIds.toSet)
  }
}
