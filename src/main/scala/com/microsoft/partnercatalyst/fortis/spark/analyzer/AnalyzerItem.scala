package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.dto.FortisItem

private[analyzer] case class AnalyzerItem[T](
  original: T,
  analyzedItem: FortisItem
)
