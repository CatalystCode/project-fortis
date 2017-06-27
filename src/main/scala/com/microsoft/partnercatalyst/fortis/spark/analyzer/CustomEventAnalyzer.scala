package com.microsoft.partnercatalyst.fortis.spark.analyzer

import java.time.Instant.now
import java.util.UUID.randomUUID

import com.microsoft.partnercatalyst.fortis.spark.streamwrappers.customevents.CustomEvent
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer

@SerialVersionUID(100L)
class CustomEventAnalyzer extends Analyzer[CustomEvent] with Serializable
  with AnalysisDefaults.EnableAll[CustomEvent] {
  override def toSchema(item: CustomEvent, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[CustomEvent] = {
    ExtendedDetails(
      id = randomUUID(),
      createdAtEpoch = now.getEpochSecond,
      body = item.message,
      title = item.title.getOrElse(""),
      publisher = item.source.getOrElse("CustomEvent"),
      sourceUrl = item.link.getOrElse(""),
      original = item
    )
  }
}