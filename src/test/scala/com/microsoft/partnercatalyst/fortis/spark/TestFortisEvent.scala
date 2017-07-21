package com.microsoft.partnercatalyst.fortis.spark

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, Details, FortisEvent, Location}

case class TestFortisEvent(
  details: Details,
  analysis: Analysis
) extends FortisEvent

case class TestFortisDetails(
  externalsourceid: String,
  eventid: String,
  eventtime: Long,
  body: String,
  title: String,
  pipelinekey: String,
  sourceurl: String,
  sharedLocations: List[Location] = List()
) extends Details