package com.microsoft.partnercatalyst.fortis.spark.dto

case class SiteSettings(
  siteName: String,
  geofence: Geofence,
  languages: Seq[String],
  defaultZoom: Int,
  title: String,
  logo: String,
  translationSvcToken: String,
  cogSpeechSvcToken: String,
  cogVisionSvcToken: String,
  cogTextSvcToken: String,
  insertiontime: Long
)