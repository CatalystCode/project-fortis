package com.microsoft.partnercatalyst.fortis.spark.dto

import java.util.UUID

trait FortisEvent {
  val details: Details
  val analysis: Analysis
}

trait Details {
  val id: String
  val eventtime: Long
  val body: String
  val title: String
  val externalsourceid: String
  val pipelinekey: String
  val sourceurl: String
  val sharedlocations: List[Location]
}

case class Analysis(
  language: Option[String] = None,
  locations: List[Location] = List(),
  sentiments: List[Double] = List(),
  moods: List[Tag] = List(),
  genders: List[Tag] = List(),
  keywords: List[Tag] = List(),
  entities: List[Tag] = List(),
  summary: Option[String] = None
)

case class Location(
  wofId: String,
  confidence: Option[Double] = None,
  latitude: Option[Double] = None,
  longitude: Option[Double] = None
)

case class Tag(
  name: String,
  confidence: Option[Double]
)