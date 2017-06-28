package com.microsoft.partnercatalyst.fortis.spark.streamwrappers.customevents

case class CustomEventFeature(
  `type`: String,
  coordinates: List[Float])

case class CustomEventFeatureCollection(
  `type`: String,
  features: List[CustomEventFeature])

case class CustomEvent(
  RowKey: String,
  created_at: String,
  featureCollection: CustomEventFeatureCollection,
  message: String,
  language: String,
  link: Option[String],
  source: Option[String],
  title: Option[String])
