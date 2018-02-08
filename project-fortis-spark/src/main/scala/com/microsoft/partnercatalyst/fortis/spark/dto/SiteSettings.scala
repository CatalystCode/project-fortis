package com.microsoft.partnercatalyst.fortis.spark.dto

import net.liftweb.json

case class SiteSettings(
  sitename: String,
  geofence_json: String,
  defaultlanguage: Option[String],
  languages_json: String,
  defaultzoom: Int,
  featureservicenamespace: Option[String],
  title: String,
  logo: String,
  translationsvctoken: String,
  cogspeechsvctoken: String,
  cogvisionsvctoken: String,
  cogtextsvctoken: String,
  insertiontime: Long
)
 {

  def getAllLanguages(): Seq[String] = {
    implicit val formats = json.DefaultFormats

    val languages = json.parse(languages_json).extract[List[String]]

    defaultlanguage match {
      case None => languages
      case Some(language) => (Set(language) ++ languages.toSet).toSeq
    }
  }

  def getGeofence(): Geofence = {
    implicit val formats = json.DefaultFormats

    val geofence = json.parse(geofence_json).extract[List[Double]]

    Geofence(
      north = geofence(0),
      west = geofence(1),
      south = geofence(2),
      east = geofence(3)
    )
  }

}