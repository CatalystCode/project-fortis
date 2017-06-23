package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, FortisAnalysis, FortisMessage, Location}

case class AnalyzerMessage[T](
 body: String,
 title: String,
 source: String,
 sharedLocations: List[Location] = List(),
 original: T
) extends FortisMessage

case class AnalyzerOutput[T](
  fortisMessage: AnalyzerMessage[T],
  analysis: Analysis
) extends FortisAnalysis