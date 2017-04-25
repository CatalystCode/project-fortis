package com.microsoft.partnercatalyst.fortis.spark.instagram

import com.microsoft.partnercatalyst.fortis.spark.instagram.dto.{Image, Instagram, JsonInstagramResponse}
import net.liftweb.json
import net.liftweb.json.DefaultFormats

import scala.io.Source

case class InstagramContext(accessToken: String, apiHost: String = "api.instagram.com")

abstract class InstagramClient(auth: InstagramContext) {
  implicit val formats = DefaultFormats

  def loadNewInstagrams(): Seq[Instagram] = {
    json.parse(fetchInstagramResponse())
      .extract[JsonInstagramResponse]
      .data
      .filter(x => "image".equals(x.`type`))
      .map(x => Instagram(
        thumbnail = Image(
          url=x.images.thumbnail.url,
          height=x.images.thumbnail.height,
          width=x.images.thumbnail.width),
        image = Image(
          url=x.images.standard_resolution.url,
          height=x.images.standard_resolution.height,
          width=x.images.standard_resolution.width),
        id=x.id,
        link=x.link,
        createdAtEpoch=x.created_time.toLong)
      )
  }

  protected def fetchInstagramResponse(): String
}

case class Location(lat: Double, lng: Double, radiusMeters: Int = 1000)

class InstagramLocationClient(location: Location, auth: InstagramContext) extends InstagramClient(auth) {
  override protected def fetchInstagramResponse(): String = {
    val url = s"https://${auth.apiHost}/v1/media/search?lat=${location.lat}&lng=${location.lng}&access_token=${auth.accessToken}"
    Source.fromURL(url).mkString
  }
}

case class Tag(name: String)

class InstagramTagClient(tag: Tag, auth: InstagramContext) extends InstagramClient(auth) {
  override protected def fetchInstagramResponse(): String = {
    val url = s"https://${auth.apiHost}/v1/tags/${tag.name}/media/recent?access_token=${auth.accessToken}"
    Source.fromURL(url).mkString
  }
}
