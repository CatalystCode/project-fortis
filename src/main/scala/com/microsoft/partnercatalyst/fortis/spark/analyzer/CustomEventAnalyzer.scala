package com.microsoft.partnercatalyst.fortis.spark.analyzer

import java.time.Instant.now

import com.microsoft.partnercatalyst.fortis.spark.sources.streamwrappers.customevents.CustomEvent
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer

@SerialVersionUID(100L)
class CustomEventAnalyzer extends Analyzer[CustomEvent] with Serializable
  with AnalysisDefaults.EnableAll[CustomEvent] {
  override def toSchema(item: CustomEvent, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[CustomEvent] = {
    ExtendedDetails(
      id = item.RowKey,
      externalsourceid = item.source.getOrElse("N/A"),
      eventtime = now.getEpochSecond,
      body = item.message,
      title = item.title.getOrElse(""),
      pipelinekey = item.source.getOrElse("CustomEvent"),
      sourceUrl = item.link.getOrElse(""),
      original = item
    )
  }
}