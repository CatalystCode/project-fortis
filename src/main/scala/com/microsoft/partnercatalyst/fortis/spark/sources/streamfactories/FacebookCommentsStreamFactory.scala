package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.github.catalystcode.fortis.spark.streaming.facebook.dto.FacebookComment
import com.github.catalystcode.fortis.spark.streaming.facebook.{FacebookAuth, FacebookUtils}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.{ConnectorConfig, StreamFactory}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

class FacebookCommentStreamFactory extends StreamFactoryBase[FacebookComment] {
  override protected def canHandle(connectorConfig: ConnectorConfig): Boolean = {
    connectorConfig.name == "FacebookComment"
  }

  override protected def buildStream(ssc: StreamingContext, connectorConfig: ConnectorConfig): DStream[FacebookComment] = {
    import ParameterExtensions._

    val params = connectorConfig.parameters
    val facebookAuth = FacebookAuth(
      params.getAs[String]("appId"),
      params.getAs[String]("appSecret"),
      params.getAs[String]("accessToken")
    )

    FacebookUtils.createCommentsStreams(ssc, facebookAuth, params.getTrustedSources.toSet)
  }
}
