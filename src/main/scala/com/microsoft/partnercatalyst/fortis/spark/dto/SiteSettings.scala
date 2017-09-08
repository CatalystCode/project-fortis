package com.microsoft.partnercatalyst.fortis.spark.dto

case class SiteSettings(
  sitename: String,
  geofence: Seq[Double],
  defaultlanguage: Option[String],
  languages: Seq[String],
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

  def getGeofence(): Geofence = Geofence(
    north = geofence(0),
    west = geofence(1),
    south = geofence(2),
    east = geofence(3)
  )

}