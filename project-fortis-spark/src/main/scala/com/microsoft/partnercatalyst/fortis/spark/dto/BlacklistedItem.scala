package com.microsoft.partnercatalyst.fortis.spark.dto

case class BlacklistedItem(
  conjunctiveFilter: Set[String],
  isLocation: Boolean
)