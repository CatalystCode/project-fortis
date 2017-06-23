package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.streamwrappers.radio.RadioTranscription
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractor

class RadioAnalyzer extends Analyzer[RadioTranscription]
  with AnalyzerDefault.EnableAll[RadioTranscription] {
  override def toSchema(item: RadioTranscription, locationsExtractor: LocationsExtractor, imageAnalyzer: ImageAnalyzer): AnalyzerMessage[RadioTranscription] = {
    AnalyzerMessage(
      body = item.text,
      title = "",
      source = item.radioUrl,
      original = item
    )
  }
}
