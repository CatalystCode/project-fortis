package com.microsoft.partnercatalyst.fortis.spark.analyzer

import java.net.URL

import com.github.catalystcode.fortis.spark.streaming.rss.RSSEntry
import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import org.jsoup.Jsoup
import org.jsoup.nodes.Document

@SerialVersionUID(100L)
class RSSAnalyzer extends Analyzer[RSSEntry] with Serializable with AnalysisDefaults.EnableAll[RSSEntry] with Loggable {

  override def toSchema(item: RSSEntry, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[RSSEntry] = {
    val body = readDescription(item)
    ExtendedDetails(
      eventid = s"RSS.${item.uri}",
      sourceeventid = item.uri,
      eventtime = item.publishedDate,
      body = body,
      imageurl = None,
      title = item.title,
      externalsourceid = item.source.uri,
      pipelinekey = "RSS",
      sourceurl = item.uri,
      sharedLocations = List(),
      original = item
    )
  }

  private[analyzer] def fetchDocument(item: RSSEntry): Option[Document] = {
    try {
      fetchDocument(item.uri)
    } catch {
      case e: Exception => {
        if (item.links.nonEmpty) {
          fetchDocument(item.links.head.href)
        } else {
          None
        }
      }
    }
  }

  private[analyzer] def fetchDocument(url: String): Option[Document] = {
    try {
      Some(Jsoup.parse(new URL(url), 10*1000))
    } catch {
      case e: Exception => {
        logError(s"Unable to fetch from RSS entry URL: ${url}", e)
        None
      }
    }
  }

  private[analyzer] def readDescription(item: RSSEntry): String = {
    if (item == null || item.description == null || item.description.value == null) {
      return ""
    }

    try {
      Jsoup.parse(item.description.value).text()
    } catch {
      case e: Exception => {
        item.description.value
      }
    }
  }

}
