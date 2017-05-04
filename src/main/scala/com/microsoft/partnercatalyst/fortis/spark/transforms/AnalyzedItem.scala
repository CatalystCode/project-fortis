package com.microsoft.partnercatalyst.fortis.spark.transforms

case class Analysis(
  language: Option[String] = None,
  locations: List[Location] = List(),
  sentiments: List[Tag] = List(),
  moods: List[Tag] = List(),
  genders: List[Tag] = List(),
  keywords: List[Tag] = List(),
  entities: List[Tag] = List(),
  summary: Option[String] = None
)

case class Location(
  wofId: String,
  confidence: Option[Double] = None
)

case class Tag(
  name: String,
  confidence: Double
)

case class AnalyzedItem[T](
  originalItem: T,
  source: String,
  analysis: Analysis
)
