package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import com.microsoft.partnercatalyst.fortis.spark.transforms.{Analysis, Location}

case class Geofence(north: Double, west: Double, south: Double, east: Double)

object StringUtils {
  def ngrams(text: String, n: Int, sep: String = " "): Seq[String] = {
    val words = text.replaceAll("\\p{P}", sep).split(sep).filter(x => !x.isEmpty)
    val ngrams = Math.min(n, words.length)
    (1 to ngrams).flatMap(i => words.sliding(i).map(_.mkString(sep)))
  }
}

class LocationsExtractor(geofence: Geofence, ngrams: Int = 3) extends Serializable {
  protected var lookup: Map[String, String] = _

  def buildLookup(): this.type = {
    // todo: fetch locations for geofence from postgres
    lookup = Map()
    this
  }

  def analyze(text: String): Analysis = {
    val words = StringUtils.ngrams(text, ngrams).toSet
    val geometries = words.flatMap(word => lookup.get(word))
    Analysis(locations = geometries.map(geo => Location(geometry = Some(geo))).toList)
  }
}
