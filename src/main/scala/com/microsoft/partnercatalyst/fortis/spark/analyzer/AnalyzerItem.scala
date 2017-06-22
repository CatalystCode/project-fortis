package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.dto.AnalyzedItem

case class AnalyzerItem[T](
  original: T,
  analyzedItem: AnalyzedItem
)
