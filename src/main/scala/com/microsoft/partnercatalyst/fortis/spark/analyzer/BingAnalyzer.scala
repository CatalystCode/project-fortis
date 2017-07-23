package com.microsoft.partnercatalyst.fortis.spark.analyzer

import java.text.SimpleDateFormat
import java.util.TimeZone
import java.net.URL

import com.github.catalystcode.fortis.spark.streaming.bing.dto.BingPost
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer

@SerialVersionUID(100L)
class BingAnalyzer extends Analyzer[BingPost] with Serializable
  with AnalysisDefaults.EnableAll[BingPost] {

  private val DefaultFormat = "yyyy-MM-dd'T'HH:mm:ss"
  private val DefaultTimezone = "UTC"

  override def toSchema(item: BingPost, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[BingPost] = {
    ExtendedDetails(
      eventid = item.url,
      eventtime = convertDatetimeStringToEpochLong(item.dateLastCrawled),
      externalsourceid = new URL(item.url).getHost,
      body = item.snippet,
      title = item.name,
      pipelinekey = "Bing",
      sourceurl = item.url,
      original = item
    )
  }

  private def convertDatetimeStringToEpochLong(dateStr: String, format: Option[String] = None, timezone: Option[String] = None): Long ={
      val sdf = new SimpleDateFormat(format.getOrElse(DefaultFormat))
      sdf.setTimeZone(TimeZone.getTimeZone(timezone.getOrElse(DefaultTimezone)))

      sdf.parse(dateStr).getTime
  }
}
