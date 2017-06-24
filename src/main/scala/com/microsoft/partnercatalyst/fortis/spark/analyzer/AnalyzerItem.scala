package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, FortisEvent, Details, Location}

case class ExtendedEvent[T](
  details: ExtendedDetails[T],
  analysis: Analysis
) extends FortisEvent

case class ExtendedDetails[T](
  body: String,
  title: String,
  source: String,
  sharedLocations: List[Location] = List(),
  original: T
) extends Details