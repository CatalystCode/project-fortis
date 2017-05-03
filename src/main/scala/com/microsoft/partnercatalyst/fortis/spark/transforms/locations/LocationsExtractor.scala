package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.{Analysis, Location}

import scala.collection.mutable

case class Geofence(north: Double, west: Double, south: Double, east: Double)

object StringUtils {
  def ngrams(text: String, n: Int, sep: String = " "): Seq[String] = {
    val words = text.replaceAll("\\p{P}", sep).split(sep).filter(x => !x.isEmpty)
    val ngrams = Math.min(n, words.length)
    (1 to ngrams).flatMap(i => words.sliding(i).map(_.mkString(sep)))
  }
}

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
      // TODO: determine which fields should be put into map
      map.getOrElseUpdate(location.name, mutable.Set()).add(location.id)
    })

    lookup = map.map(kv => (kv._1, kv._2.toSet)).toMap
    this
  }

  def analyze(text: String): Analysis = {
    val words = StringUtils.ngrams(text.toLowerCase, ngrams).toSet
    val geometries = words.flatMap(word => lookup.get(word)).flatten
    Analysis(locations = geometries.map(geo => Location(geometry = Some(geo))).toList)
  }
}
