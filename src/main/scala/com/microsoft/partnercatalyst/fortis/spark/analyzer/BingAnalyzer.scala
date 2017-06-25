package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.github.catalystcode.fortis.spark.streaming.bing.dto.BingPost
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer

class BingAnalyzer extends Analyzer[BingPost]
  with AnalysisDefaults.EnableAll[BingPost] {
  override def toSchema(item: BingPost, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[BingPost] = {
    ExtendedDetails(
      body = item.snippet,
      title = item.name,
      source = item.url,
      original = item
    )
  }
}
