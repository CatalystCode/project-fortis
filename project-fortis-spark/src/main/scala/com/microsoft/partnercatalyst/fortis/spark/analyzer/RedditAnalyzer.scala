package com.microsoft.partnercatalyst.fortis.spark.analyzer

import java.util.UUID.randomUUID

import com.github.catalystcode.fortis.spark.streaming.reddit.dto.RedditObject
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer

@SerialVersionUID(100L)
class RedditAnalyzer extends Analyzer[RedditObject] with Serializable
  with AnalysisDefaults.EnableAll[RedditObject] {
  override def toSchema(item: RedditObject, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[RedditObject] = {
    ExtendedDetails(
      eventid = s"Reddit.${item.data.id.getOrElse(randomUUID()).toString}",
      sourceeventid = item.data.id.getOrElse("").toString,
      eventtime = item.data.created_utc.get.toLong,
      body = item.data.description.getOrElse(""),
      title = item.data.title.getOrElse(""),
      imageurl = None,
      externalsourceid = item.data.author.getOrElse(""),
      pipelinekey = "Reddit",
      sourceurl = item.data.url.getOrElse(""),
      original = item
    )
  }
}
