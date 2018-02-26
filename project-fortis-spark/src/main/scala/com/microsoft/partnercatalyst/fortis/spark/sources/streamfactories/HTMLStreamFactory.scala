package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.github.catalystcode.fortis.spark.streaming.html.{HTMLInputDStream, HTMLPage}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.ConnectorConfig
import org.apache.spark.storage.StorageLevel
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

class HTMLStreamFactory extends StreamFactoryBase[HTMLPage] {

  override protected def canHandle(connectorConfig: ConnectorConfig): Boolean = {
    "HTML".equalsIgnoreCase(connectorConfig.name)
  }

  override protected def buildStream(ssc: StreamingContext, connectorConfig: ConnectorConfig): DStream[HTMLPage] = {
    val params = connectorConfig.parameters
    connectorConfig.parameters.get("feedUrls") match {
      case Some(feedUrls:String) =>
        val urls = feedUrls.split("[|]")
        new HTMLInputDStream(
          urls,
          ssc,
          storageLevel = StorageLevel.MEMORY_ONLY,
          requestHeaders = Map(
            "User-Agent" -> params.getOrElse("userAgent", "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36").toString
          ),
          maxDepth = params.getOrElse("maxDepth", "1").toString.toInt,
          pollingPeriodInSeconds = params.getOrElse("pollingPeriodInSeconds", "3600").toString.toInt,
          cacheEditDistanceThreshold = params.getOrElse("cacheEditDistanceThreshold", "0.0001").toString.toDouble
        )
      case _ =>
        throw new Exception("No feedUrls present for HTML feed stream $connectorConfig.")
    }
  }

}

