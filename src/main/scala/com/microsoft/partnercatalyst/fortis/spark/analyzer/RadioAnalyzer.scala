package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.streamwrappers.radio.RadioTranscription
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer

class RadioAnalyzer extends Analyzer[RadioTranscription]
  with AnalysisDefaults.EnableAll[RadioTranscription] {
  override def toSchema(item: RadioTranscription, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[RadioTranscription] = {
    ExtendedDetails(
      body = item.text,
      title = "",
      source = item.radioUrl,
      original = item
    )
  }
}
