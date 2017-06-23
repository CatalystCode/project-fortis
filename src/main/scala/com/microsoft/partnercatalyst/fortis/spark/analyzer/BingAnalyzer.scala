package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.github.catalystcode.fortis.spark.streaming.bing.dto.BingPost
import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, AnalyzedItem}
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractor

class BingAnalyzer extends Analyzer[BingPost]
  with AnalyzerDefault.EnableAll[BingPost] {
  override def toSchema(item: BingPost, locationsExtractor: LocationsExtractor, imageAnalyzer: ImageAnalyzer): AnalyzedItem = {
    AnalyzedItem(
      body = item.snippet,
      title = item.name,
      source = item.url,
      analysis = Analysis()
    )
  }
}
