package com.microsoft.partnercatalyst.fortis.spark.dto

import java.util.UUID

case class SiteSettings(
  id: UUID,
  siteName: String,
  geofence: Geofence,
  languages: Set[String],
  defaultZoom: Int,
  title: String,
  logo: String,
  translationSvcToken: String,
  cogSpeechSvcToken: String,
  cogVisionSvcToken: String,
  cogTextSvcToken: String,
  insertionTime: String
)