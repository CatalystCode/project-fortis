package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, Details, FortisEvent, Location}

case class ExtendedFortisEvent[T](
  details: ExtendedDetails[T],
  analysis: Analysis
) extends FortisEvent {
  override def copy(analysis: Analysis) = {
    ExtendedFortisEvent[T](
      details = details,
      analysis = Option(analysis).getOrElse(this.analysis))
  }
}

case class ExtendedDetails[T](
  eventid: String,
  sourceeventid: String,
  eventtime: Long,
  body: String,
  title: String,
  imageurl: Option[String],
  pipelinekey: String,
  externalsourceid: String,
  sourceurl: String,
  sharedLocations: List[Location] = List(),
  original: T
) extends Details