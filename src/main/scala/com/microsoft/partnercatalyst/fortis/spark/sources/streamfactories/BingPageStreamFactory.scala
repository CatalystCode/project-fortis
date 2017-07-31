package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.github.catalystcode.fortis.spark.streaming.bing.dto.BingPost
import com.github.catalystcode.fortis.spark.streaming.bing.{BingAuth, BingUtils}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.{ConnectorConfig, StreamFactory}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

class BingPageStreamFactory extends StreamFactory[BingPost]{
  override def createStream(ssc: StreamingContext): PartialFunction[ConnectorConfig, DStream[BingPost]] = {
    case ConnectorConfig("BingPage", params) =>
      import ParameterExtensions._

      val auth = BingAuth(params.getAs[String]("accessToken"))
      val searchInstanceId = params.getAs[String]("searchInstanceId")
      val keywords = params.getAs[String]("keywords").split('|')

      BingUtils.createPageStream(ssc, auth, searchInstanceId, keywords)
  }
}