package com.microsoft.partnercatalyst.fortis.spark.analyzer

import java.time.Instant.now
import java.util.UUID.randomUUID

import com.github.catalystcode.fortis.spark.streaming.reddit.dto.RedditObject
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer

@SerialVersionUID(100L)
class RedditAnalyzer extends Analyzer[RedditObject] with Serializable with AnalysisDefaults.EnableAll[RedditObject] {
  override def toSchema(item: RedditObject, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[RedditObject] = {
    ExtendedDetails(
      id = randomUUID(),
      createdAtEpoch = now.getEpochSecond,
      body = item.data.description.getOrElse(""),
      title = item.data.title.getOrElse(""),
      publisher = "Reddit",
      sourceUrl = item.data.url.getOrElse(""),
      original = item
    )
  }
}
