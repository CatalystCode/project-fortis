package com.microsoft.partnercatalyst.fortis.spark.analyzer

import java.util.UUID.randomUUID
import java.time.Instant.now

import com.github.catalystcode.fortis.spark.streaming.bing.dto.BingPost
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer

class BingAnalyzer extends Analyzer[BingPost]
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
