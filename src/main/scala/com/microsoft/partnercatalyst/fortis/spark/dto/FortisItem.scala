package com.microsoft.partnercatalyst.fortis.spark.dto

trait FortisItem {
  def source: String
  def sharedLocations: List[Location]
  def analysis: Analysis
}