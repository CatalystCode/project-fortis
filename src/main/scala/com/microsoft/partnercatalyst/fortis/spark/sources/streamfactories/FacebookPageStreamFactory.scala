package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.github.catalystcode.fortis.spark.streaming.facebook.dto.FacebookPost
import com.github.catalystcode.fortis.spark.streaming.facebook.{FacebookAuth, FacebookUtils}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.{ConnectorConfig, StreamFactory}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

class FacebookPageStreamFactory extends StreamFactoryBase[FacebookPost] {
  override protected def canHandle(connectorConfig: ConnectorConfig): Boolean = {
    connectorConfig.name == "FacebookPage"
  }

  override protected def buildStream(streamingContext: StreamingContext, connectorConfig: ConnectorConfig): DStream[FacebookPost] = {
    import ParameterExtensions._

    val params = connectorConfig.parameters
    val facebookAuth = FacebookAuth(
      params.getAs[String]("appId"),
      params.getAs[String]("appSecret"),
      params.getAs[String]("accessToken")
    )

    FacebookUtils.createPageStreams(streamingContext, facebookAuth, params.getTrustedSources.toSet)
  }
}
