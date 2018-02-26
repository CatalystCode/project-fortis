package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.github.catalystcode.fortis.spark.streaming.instagram.dto.InstagramItem
import com.github.catalystcode.fortis.spark.streaming.instagram.{InstagramAuth, InstagramUtils}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.ConnectorConfig
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

class InstagramTagStreamFactory extends StreamFactoryBase[InstagramItem]{
  override protected def canHandle(connectorConfig: ConnectorConfig): Boolean = {
    "InstagramTag".equalsIgnoreCase(connectorConfig.name)
  }

  override protected def buildStream(ssc: StreamingContext, connectorConfig: ConnectorConfig): DStream[InstagramItem] = {
    import ParameterExtensions._

    val params = connectorConfig.parameters
    val auth = InstagramAuth(params.getAs[String]("authToken"))

    InstagramUtils.createTagStream(ssc, auth, params.getAs[String]("tag"))
  }
}