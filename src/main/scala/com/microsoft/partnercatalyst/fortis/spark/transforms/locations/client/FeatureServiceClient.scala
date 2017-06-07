package com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client

import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.Geofence
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.dto.{FeatureServiceFeature, FeatureServiceResponse}
import net.liftweb.json

import scala.io.Source
import scala.util.{Failure, Success, Try}

@SerialVersionUID(100L)
class FeatureServiceClient(host: String) extends Serializable with Loggable {
  def bbox(geofence: Geofence): Iterable[FeatureServiceFeature] = {
    unpack(fetchBboxResponse(geofence), "bbox")
  }

  def point(latitude: Double, longitude: Double): Iterable[FeatureServiceFeature] = {
    unpack(fetchPointResponse(latitude = latitude, longitude = longitude), "point")
  }

  def name(names: Iterable[String]): Iterable[FeatureServiceFeature] = {
    unpack(fetchNameResponse(names), "name")
  }

  private def unpack(responseBody: Try[String], endpointName: String): Iterable[FeatureServiceFeature] = {
    val parsedResponse = responseBody.flatMap(parseResponse)
    parsedResponse match {
      case Success(domainObject) =>
        domainObject
      case Failure(err) =>
        logError(s"Error fetching feature service $endpointName", err)
        List()
    }
  }

  private def parseResponse(response: String): Try[Iterable[FeatureServiceFeature]] = {
    implicit val formats = json.DefaultFormats

    Try(json.parse(response).extract[FeatureServiceResponse].features)
  }

  protected def fetchBboxResponse(geofence: Geofence): Try[String] = {
    val fetch = s"http://$host/features/bbox/${geofence.north}/${geofence.west}/${geofence.south}/${geofence.east}"
    fetchResponse(fetch)
  }

  protected def fetchPointResponse(latitude: Double, longitude: Double): Try[String] = {
    val fetch = s"http://$host/features/point/$latitude/$longitude"
    fetchResponse(fetch)
  }

  protected def fetchNameResponse(names: Iterable[String]): Try[String] = {
    val fetch = s"http://$host/features/name/${names.mkString(",")}"
    fetchResponse(fetch)
  }

  private def fetchResponse(url: String): Try[String] = {
    Try(Source.fromURL(url)("UTF-8").mkString)
  }
}
