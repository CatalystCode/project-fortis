package com.microsoft.partnercatalyst.fortis.spark.analyzer

import java.util.UUID.randomUUID
import java.time.Instant.now

import com.microsoft.partnercatalyst.fortis.spark.streamwrappers.radio.RadioTranscription
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer

@SerialVersionUID(100L)
class RadioAnalyzer extends Analyzer[RadioTranscription] with Serializable
  with AnalysisDefaults.EnableAll[RadioTranscription] {
  override def toSchema(item: RadioTranscription, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[RadioTranscription] = {
    ExtendedDetails(
      id = randomUUID(),
      createdAtEpoch = now.getEpochSecond,
      body = item.text,
      title = "",
      publisher = "Radio",
      sourceUrl = item.radioUrl,
      original = item
    )
  }
}
