package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.Location

import scala.collection.mutable

case class Geofence(north: Double, west: Double, south: Double, east: Double)

@SerialVersionUID(100L)
class LocationsExtractor(
  featureServiceClient: FeatureServiceClient,
  geofence: Geofence,
  ngrams: Int = 3
) extends Serializable {

  protected var lookup: Map[String, Set[String]] = _

  def buildLookup(): this.type = {
    val map = mutable.Map[String, mutable.Set[String]]()
    featureServiceClient.bbox(geofence).foreach(location => {
      val key = location.name.toLowerCase
      val value = location.id
      map.getOrElseUpdate(key, mutable.Set()).add(value)
    })

    lookup = map.map(kv => (kv._1, kv._2.toSet)).toMap
    this
  }

  def analyze(text: String): Iterable[Location] = {
    val words = StringUtils.ngrams(text.toLowerCase, ngrams).toSet
    val locationsInGeofence = words.flatMap(word => lookup.get(word)).flatten.toSet
    locationsInGeofence.map(wofId => Location(wofId, confidence = Some(0.5)))
  }

  def fetch(latitude: Double, longitude: Double): Iterable[Location] = {
    val locationsForPoint = featureServiceClient.point(latitude = latitude, longitude = longitude)
    val locationsInGeofence = locationsForPoint.flatMap(location => lookup.get(location.name.toLowerCase)).flatten.toSet
    locationsInGeofence.map(wofId => Location(wofId, confidence = Some(1.0)))
  }
}
