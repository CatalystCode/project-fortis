package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import java.net.URL

import com.github.catalystcode.fortis.spark.streaming.rss.{RSSEntry, RSSInputDStream}
import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.ConnectorConfig
import org.apache.spark.storage.StorageLevel
import org.apache.spark.streaming.{Seconds, StreamingContext}
import org.apache.spark.streaming.dstream.DStream

class RSSStreamFactory extends StreamFactoryBase[RSSEntry] with Loggable {

  override protected def canHandle(connectorConfig: ConnectorConfig): Boolean = {
    connectorConfig.name == "RSS"
  }

  override protected def buildStream(ssc: StreamingContext, connectorConfig: ConnectorConfig): DStream[RSSEntry] = {
    val params = connectorConfig.parameters
    connectorConfig.parameters.get("feedUrls") match {
      case Some(feedUrls:String) => {
        val urls = feedUrls.split("[|]").map(u=>new URL(u))
//        val pollingPeriodInSeconds = params.getOrElse("pollingPeriodInSeconds", "10").toString.toInt
        val stream = new RSSLiveStream(urls, ssc, StorageLevel.MEMORY_ONLY)
        stream
      }
      case _ => {
        throw new Exception("No feedUrls present for RSS feed stream $connectorConfig.")
      }
    }
  }

}
