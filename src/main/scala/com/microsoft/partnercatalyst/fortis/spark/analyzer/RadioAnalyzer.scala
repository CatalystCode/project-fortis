package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, AnalyzedItem}
import com.microsoft.partnercatalyst.fortis.spark.streamwrappers.radio.RadioTranscription
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractor

class RadioAnalyzer extends Analyzer[RadioTranscription] {
  override def toSchema(item: RadioTranscription, locationsExtractor: LocationsExtractor, imageAnalyzer: ImageAnalyzer): AnalyzedItem = {
    AnalyzedItem(
      body = item.text,
      title = "",
      source = item.radioUrl,
      analysis = Analysis()
    )
  }
}
