package com.microsoft.partnercatalyst.fortis.spark.dto

import java.util.Objects

trait FortisEvent {
  val details: Details
  val analysis: Analysis
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
    if ("continent".equalsIgnoreCase(layer)) {
      1090
    } else if ("empire".equalsIgnoreCase(layer)) {
      1080
    } else if ("country".equalsIgnoreCase(layer)) {
      1070
    } else if ("dependency".equalsIgnoreCase(layer) || "disputed".equalsIgnoreCase(layer)) {
      1065
    } else if ("macroregion".equalsIgnoreCase(layer)) {
      1060
    } else if ("region".equalsIgnoreCase(layer)) {
      1050
    } else if ("macrocounty".equalsIgnoreCase(layer)){
      1040
    } else if ("county".equalsIgnoreCase(layer)) {
      1030
    } else if ("metro area".equalsIgnoreCase(layer) || "localadmin".equalsIgnoreCase(layer)) {
      1020
    } else if ("locality".equalsIgnoreCase(layer)) {
      1010
    } else if ("borough".equalsIgnoreCase(layer)) {
      1005
    } else if ("macrohood".equalsIgnoreCase(layer)) {
      1000
    } else if ("neighbourhood".equalsIgnoreCase(layer)) {
      990
    } else if ("microhood".equalsIgnoreCase(layer)) {
      980
    } else if ("campus".equalsIgnoreCase(layer)) {
      970
    } else if ("building".equalsIgnoreCase(layer)) {
      960
    } else if ("address".equalsIgnoreCase(layer)) {
      950
    } else if ("venue".equalsIgnoreCase(layer)) {
      940
    } else {
      // we usually care about the most granular location values
      // so it's fine to treat unknown values as greater than all
      99999999
    }
  }
}

case class Tag(
  name: String,
  confidence: Option[Double]
)