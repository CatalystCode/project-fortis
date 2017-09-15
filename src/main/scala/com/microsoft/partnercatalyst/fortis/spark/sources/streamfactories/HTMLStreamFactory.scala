package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import java.net.URL

import com.github.catalystcode.fortis.spark.streaming.html.{HTMLInputDStream, HTMLOnDemandInputDStream, HTMLPage}
import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.ConnectorConfig
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

class HTMLStreamFactory extends StreamFactoryBase[HTMLPage] with Loggable {

  override protected def canHandle(connectorConfig: ConnectorConfig): Boolean = {
    connectorConfig.name.equalsIgnoreCase("HTML")
  }

  override protected def buildStream(ssc: StreamingContext, connectorConfig: ConnectorConfig): DStream[HTMLPage] = {
    val params = connectorConfig.parameters
    connectorConfig.parameters.get("feedUrls") match {
      case Some(feedUrls:String) => {
        val urls = feedUrls.split("[|]").map(u=>new URL(u))
        new HTMLInputDStream(
          urls,
          ssc,
          requestHeaders = Map(
            "User-Agent" -> params.getOrElse("userAgent", "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36").toString
          ),
          maxDepth = params.getOrElse("maxDepth", "1").toString.toInt,
          cacheEditDistanceThreshold = params.getOrElse("cacheEditDistanceThreshold", "0.1").toString.toDouble
        )
      }
      case _ => {
        throw new Exception("No feedUrls present for HTML feed stream $connectorConfig.")
      }
    }
  }

}
