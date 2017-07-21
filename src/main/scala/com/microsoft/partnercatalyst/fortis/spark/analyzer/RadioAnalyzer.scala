package com.microsoft.partnercatalyst.fortis.spark.analyzer

import java.time.Instant.now
import java.util.UUID.randomUUID

import com.microsoft.partnercatalyst.fortis.spark.sources.streamwrappers.radio.RadioTranscription
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer

@SerialVersionUID(100L)
class RadioAnalyzer extends Analyzer[RadioTranscription] with Serializable
  with AnalysisDefaults.EnableAll[RadioTranscription] {
  override def toSchema(item: RadioTranscription, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[RadioTranscription] = {
    ExtendedDetails(
      eventid = randomUUID().toString,
      eventtime = now.getEpochSecond,
      externalsourceid = item.radioUrl,
      body = item.text,
      title = "",
      pipelinekey = "Radio",
      sourceurl = item.radioUrl,
      original = item
    )
  }
}
