package com.microsoft.partnercatalyst.fortis.spark.analyzer

import java.util.UUID.randomUUID

import com.microsoft.partnercatalyst.fortis.spark.sources.streamwrappers.customevents.CustomEvent
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer

@SerialVersionUID(100L)
class CustomEventAnalyzer extends Analyzer[CustomEvent] with Serializable
  with AnalysisDefaults.EnableAll[CustomEvent] {
  override def toSchema(item: CustomEvent, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[CustomEvent] = {
    ExtendedDetails(
      eventid = s"${item.source.getOrElse("CustomEvent")}.${randomUUID()}",
      sourceeventid = item.RowKey,
      externalsourceid = item.source.getOrElse("N/A"),
      eventtime = item.created_at.toLong,
      body = item.message,
      title = item.title.getOrElse(""),
      imageurl = None,
      pipelinekey = item.source.getOrElse("CustomEvent"),
      sourceurl = item.link.getOrElse(""),
      original = item
    )
  }
}