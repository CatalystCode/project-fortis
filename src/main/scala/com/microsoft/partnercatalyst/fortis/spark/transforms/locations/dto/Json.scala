package com.microsoft.partnercatalyst.fortis.spark.transforms.locations.dto

case class FeatureServiceResponse(features: List[FeatureServiceFeature])
case class FeatureServiceFeature(id: String, name: String, layer: String)
