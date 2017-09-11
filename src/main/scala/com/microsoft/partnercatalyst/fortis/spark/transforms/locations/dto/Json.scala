package com.microsoft.partnercatalyst.fortis.spark.transforms.locations.dto

import com.microsoft.partnercatalyst.fortis.spark.dto.Location

case class FeatureServiceResponse(features: List[FeatureServiceFeature])
case class FeatureServiceFeature(id: String, name: String, layer: String, centroid: Option[List[Double]] = None)

object FeatureServiceFeature {
  val DefaultLatitude = -1d
  val DefaultLongitude = -1d

  def toLocation(feature: FeatureServiceFeature): Location = {
    Location(
      wofId = feature.id,
      name = feature.name,
      layer = feature.layer,
      longitude = feature.centroid.map(_.head).getOrElse(DefaultLongitude),
      latitude = feature.centroid.map(_.tail.head).getOrElse(DefaultLatitude))
  }
}
