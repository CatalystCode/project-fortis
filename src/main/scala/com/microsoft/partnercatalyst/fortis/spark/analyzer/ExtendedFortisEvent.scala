package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, Details, FortisEvent, Location}

case class ExtendedFortisEvent[T](
  details: ExtendedDetails[T],
  analysis: Analysis
) extends FortisEvent

case class ExtendedDetails[T](
                               id: String,
                               eventtime: Long,
                               body: String,
                               title: String,
                               pipelinekey: String,
                               externalsourceid: String,
                               sourceurl: String,
                               sharedlocations: List[Location] = List(),
                               original: T
) extends Details