package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.github.catalystcode.fortis.spark.streaming.instagram.dto.InstagramItem
import com.github.catalystcode.fortis.spark.streaming.instagram.{InstagramAuth, InstagramUtils}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.{ConnectorConfig, StreamFactory}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

class InstagramTagStreamFactory extends StreamFactoryBase[InstagramItem]{
  override protected def canHandle(connectorConfig: ConnectorConfig): Boolean = {
    connectorConfig.name == "InstagramTag"
  }

  override protected def buildStream(streamingContext: StreamingContext, connectorConfig: ConnectorConfig): DStream[InstagramItem] = {
    import ParameterExtensions._

    val params = connectorConfig.parameters
    val auth = InstagramAuth(params.getAs[String]("authToken"))

    InstagramUtils.createTagStream(streamingContext, auth, params.getAs[String]("tag"))
  }
}