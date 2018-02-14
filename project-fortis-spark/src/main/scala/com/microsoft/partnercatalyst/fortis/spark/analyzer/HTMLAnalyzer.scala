package com.microsoft.partnercatalyst.fortis.spark.analyzer

import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date

import com.github.catalystcode.fortis.spark.streaming.html.HTMLPage
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import org.jsoup.Jsoup
import org.jsoup.nodes.Document

@SerialVersionUID(100L)
class HTMLAnalyzer extends Analyzer[HTMLPage] with Serializable with AnalysisDefaults.EnableAll[HTMLPage] {

  override def toSchema(item: HTMLPage, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[HTMLPage] = {
    val document = Jsoup.parse(item.html)
    val url = new URL(item.url)
    val body = document match {
      case null => item.html
      case _ => document.body().text()
    }
    ExtendedDetails(
      eventid = s"HTML.${item.url}",
      sourceeventid = item.url,
      eventtime = getDate(item, document),
      body = body,
      imageurl = None,
      title = document.title(),
      externalsourceid = url.getHost,
      pipelinekey = "HTML",
      sourceurl = item.url,
      sharedLocations = List(),
      original = item
    )
  }

  private def getDate(item: HTMLPage, document: Document): Long = {
    try {
      val metaElements = document.select("meta[itemprop=datePublished]")
      if (metaElements != null) {
        val dateString = metaElements.first().attr("content")
        if (dateString != null) {
          return new SimpleDateFormat("YYYY-MM-dd").parse(dateString.trim).getTime
        }
      }
      new Date().getTime
    } catch {
      case _: Exception => new Date().getTime
    }
  }

}
