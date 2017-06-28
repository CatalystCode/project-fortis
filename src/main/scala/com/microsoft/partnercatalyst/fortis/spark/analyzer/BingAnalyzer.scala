package com.microsoft.partnercatalyst.fortis.spark.analyzer

import java.time.Instant.now
import java.util.UUID.randomUUID

import com.github.catalystcode.fortis.spark.streaming.bing.dto.BingPost
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer

@SerialVersionUID(100L)
class BingAnalyzer extends Analyzer[BingPost] with Serializable
  with AnalysisDefaults.EnableAll[BingPost] {
  override def toSchema(item: BingPost, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[BingPost] = {
    ExtendedDetails(
      id = randomUUID(),
      createdAtEpoch = now.getEpochSecond,
      body = item.snippet,
      title = item.name,
      publisher = "Bing",
      sourceUrl = item.url,
      original = item
    )
  }
}
