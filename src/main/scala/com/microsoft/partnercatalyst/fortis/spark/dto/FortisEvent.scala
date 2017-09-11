package com.microsoft.partnercatalyst.fortis.spark.dto

import java.util.Objects

trait FortisEvent {
  val details: Details
  val analysis: Analysis

  def copy(analysis: Analysis = null): FortisEvent
}

trait Details {
  val eventid: String
  val sourceeventid: String
  val eventtime: Long
  val body: String
  val title: String
  val externalsourceid: String
  val pipelinekey: String
  val sourceurl: String
  val sharedLocations: List[Location]
}

case class Analysis(
  language: Option[String] = None,
  locations: List[Location] = List(),
  sentiments: List[Double] = List(),
  moods: List[Tag] = List(),
  //todo genders: List[Tag] = List(),
  keywords: List[Tag] = List(),
  entities: List[Tag] = List(),
  summary: Option[String] = None
)

case class Location(
  wofId: String,
  layer: String,
  latitude: Double,
  longitude: Double,
  confidence: Option[Double] = None
) extends Ordered[Location] {

  override def equals(obj: scala.Any): Boolean = {
    if (obj == null) return false
    if (!obj.isInstanceOf[Location]) return false
    val location = obj.asInstanceOf[Location]
    Objects.equals(wofId, location.wofId)
  }

  override def hashCode(): Int = wofId.hashCode

  override def compare(that: Location): Int = {
    Location.layerToInt(layer).compare(Location.layerToInt(that.layer))
  }
}

object Location {
  /**
   * @see https://github.com/whosonfirst/whosonfirst-placetypes
   */
  def layerToInt(layer: String): Int = {
    Option(layer).map(_.toLowerCase) match {
      case Some("continent") =>     4000
      case Some("empire") =>        3900
      case Some("country") =>       3800
      case Some("dependency") |
           Some("disputed") =>      3700
      case Some("macroregion") =>   3600
      case Some("region") =>        3500
      case Some("macrocounty") =>   3400
      case Some("county") =>        3300
      case Some("metro area") |
           Some("localadmin") =>    3200
      case Some("locality") =>      3100
      case Some("borough") =>       3000
      case Some("macrohood") =>     2900
      case Some("neighbourhood") => 2800
      case Some("microhood") =>     2700
      case Some("campus") =>        2600
      case Some("building") =>      2500
      case Some("address") =>       2400
      case Some("venue") =>         2300
      case _ =>                     999999 // we usually care about the most granular location values
                                           // so it's fine to treat unknown values as greater than all
    }
  }
}

case class Tag(
  name: String,
  confidence: Option[Double]
)