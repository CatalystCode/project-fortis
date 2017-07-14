package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.github.catalystcode.fortis.spark.streaming.bing.dto.BingPost
import com.github.catalystcode.fortis.spark.streaming.bing.{BingAuth, BingUtils}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.{ConnectorConfig, StreamFactory}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

class BingPageStreamFactory extends StreamFactory[BingPost]{
  override def createStream(ssc: StreamingContext): PartialFunction[ConnectorConfig, DStream[BingPost]] = {
    case ConnectorConfig("BingPage", params) =>
      val auth = BingAuth(params("accessToken"))
      val searchInstanceId = params("searchInstanceId")
      val keywords = params("keywords").split('|')

      BingUtils.createPageStream(ssc, auth, searchInstanceId, keywords)
  }
}