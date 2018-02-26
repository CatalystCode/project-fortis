package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.github.catalystcode.fortis.spark.streaming.facebook.dto.FacebookPost
import com.github.catalystcode.fortis.spark.streaming.facebook.{FacebookAuth, FacebookUtils}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.ConnectorConfig
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

class FacebookPageStreamFactory extends StreamFactoryBase[FacebookPost] {
  override protected def canHandle(connectorConfig: ConnectorConfig): Boolean = {
    "FacebookPage".equalsIgnoreCase(connectorConfig.name)
  }

  override protected def buildStream(ssc: StreamingContext, connectorConfig: ConnectorConfig): DStream[FacebookPost] = {
    import ParameterExtensions._

    val params = connectorConfig.parameters
    val facebookAuth = FacebookAuth(
      params.getAs[String]("appId"),
      params.getAs[String]("appSecret"),
      params.getAs[String]("accessToken")
    )

    FacebookUtils.createPageStreams(ssc, facebookAuth, params.getTrustedSources.toSet)
  }
}
