package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.github.catalystcode.fortis.spark.streaming.facebook.dto.FacebookComment
import com.github.catalystcode.fortis.spark.streaming.facebook.{FacebookAuth, FacebookUtils}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.{ConnectorConfig, StreamFactory}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

class FacebookCommentStreamFactory extends StreamFactory[FacebookComment] {
  private val DELIMITER: String = "|"

  /**
    * Creates a DStream for a given connector config iff the connector config is supported by the stream factory.
    * The param set allows the streaming context to be curried into the partial function that creates the stream.
    *
    * @param streamingContext The Spark Streaming Context
    * @return A partial function for transforming a connector config
    */
  override def createStream(streamingContext: StreamingContext): PartialFunction[ConnectorConfig, DStream[FacebookComment]] = {
    case ConnectorConfig("FacebookComment", params) =>
      import ParameterExtensions._

      val facebookAuth = FacebookAuth(
        params.getAs[String]("appId"),
        params.getAs[String]("appSecret"),
        params.getAs[String]("accessToken")
      )

      FacebookUtils.createCommentsStreams(streamingContext, facebookAuth, params.getTrustedSources.toSet)
  }
}
