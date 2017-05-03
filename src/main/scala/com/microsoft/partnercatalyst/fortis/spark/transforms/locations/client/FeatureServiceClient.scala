package com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client

import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.Geofence
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.dto.{FeatureServiceFeature, FeatureServiceResponse}
import net.liftweb.json

import scala.io.Source

@SerialVersionUID(100L)
class FeatureServiceClient(host: String) extends Serializable {
  def bbox(geofence: Geofence): Iterable[FeatureServiceFeature] = {
    implicit val formats = json.DefaultFormats

    val response = json.parse(fetchBboxResponse(geofence))
      .extract[FeatureServiceResponse]

    response.features
  }

  protected def fetchBboxResponse(geofence: Geofence): String = {
    val fetch = s"http://$host/features/bbox/${geofence.north}/${geofence.west}/${geofence.south}/${geofence.east}"
    Source.fromURL(fetch).mkString
  }
}
