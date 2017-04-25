package com.microsoft.partnercatalyst.fortis.spark.instagram.client

import scala.io.Source

case class Location(lat: Double, lng: Double, radiusMeters: Int = 1000)

class InstagramLocationClient(location: Location, auth: Auth) extends InstagramClient(auth) {
  override protected def fetchInstagramResponse(): String = {
    val url = s"https://${auth.apiHost}/v1/media/search?lat=${location.lat}&lng=${location.lng}&access_token=${auth.accessToken}"
    Source.fromURL(url).mkString
  }
}
