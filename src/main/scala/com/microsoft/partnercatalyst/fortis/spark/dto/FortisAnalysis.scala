package com.microsoft.partnercatalyst.fortis.spark.dto

trait FortisMessage {
  val body: String
  val title: String
  val source: String
  val sharedLocations: List[Location]
}

trait FortisAnalysis {
  val fortisMessage: FortisMessage
  val analysis: Analysis
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