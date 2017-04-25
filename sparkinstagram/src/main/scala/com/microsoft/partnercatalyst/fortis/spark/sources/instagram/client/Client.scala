package com.microsoft.partnercatalyst.fortis.spark.sources.instagram.client

import com.microsoft.partnercatalyst.fortis.spark.sources.instagram.dto.{Image, Instagram, JsonInstagramResponse}
import net.liftweb.json
import net.liftweb.json.DefaultFormats

case class Auth(accessToken: String, apiHost: String = "api.instagram.com")

abstract class InstagramClient(auth: Auth) {
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
