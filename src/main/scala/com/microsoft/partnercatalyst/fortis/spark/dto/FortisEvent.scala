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
  latitude: Double,
  longitude: Double,
  confidence: Option[Double] = None
) {

  override def equals(obj: scala.Any): Boolean = {
    if (obj == null) return false
    if (!obj.isInstanceOf[Location]) return false
    val location = obj.asInstanceOf[Location]
    Objects.equals(wofId, location.wofId)
  }

  override def hashCode(): Int = wofId.hashCode
}

case class Tag(
  name: String,
  confidence: Option[Double]
)