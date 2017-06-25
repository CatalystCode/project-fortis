package com.microsoft.partnercatalyst.fortis.spark.analyzer

import java.util.UUID

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, Details, FortisEvent, Location}

case class ExtendedFortisEvent[T](
  details: ExtendedDetails[T],
  analysis: Analysis
) extends FortisEvent

case class ExtendedDetails[T](
  id: UUID,
  createdAtEpoch: Long,
  body: String,
  title: String,
  publisher: String,
  sourceUrl: String,
  sharedLocations: List[Location] = List(),
  original: T
) extends Details