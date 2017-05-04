package com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client

import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.Geofence
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.dto.{FeatureServiceFeature, FeatureServiceResponse}
import net.liftweb.json

import scala.io.Source

@SerialVersionUID(100L)
class FeatureServiceClient(host: String) extends Serializable {
  def bbox(geofence: Geofence): Iterable[FeatureServiceFeature] = {
    parseResponse(fetchBboxResponse(geofence))
  }

  def point(latitude: Double, longitude: Double): Iterable[FeatureServiceFeature] = {
    parseResponse(fetchPointResponse(latitude = latitude, longitude = longitude))
  }

  private def parseResponse(response: String): Iterable[FeatureServiceFeature] = {
    implicit val formats = json.DefaultFormats

    json.parse(response).extract[FeatureServiceResponse].features
  }

  protected def fetchBboxResponse(geofence: Geofence): String = {
    val fetch = s"http://$host/features/bbox/${geofence.north}/${geofence.west}/${geofence.south}/${geofence.east}"
    Source.fromURL(fetch).mkString
  }

  protected def fetchPointResponse(latitude: Double, longitude: Double): String = {
    val fetch = s"http://$host/features/point/$latitude/$longitude"
    Source.fromURL(fetch).mkString
  }
}
