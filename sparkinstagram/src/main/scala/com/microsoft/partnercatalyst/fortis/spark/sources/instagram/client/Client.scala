package com.microsoft.partnercatalyst.fortis.spark.sources.instagram.client

import com.microsoft.partnercatalyst.fortis.spark.sources.instagram.dto.{Image, Instagram, JsonInstagramResponse}
import net.liftweb.json

case class Auth(accessToken: String, apiHost: String = "api.instagram.com")

@SerialVersionUID(100L)
abstract class InstagramClient(auth: Auth) extends Serializable {
  def loadNewInstagrams(): Seq[Instagram] = {
    implicit val formats = json.DefaultFormats

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
        createdAtEpoch=x.created_time.toLong,
        imageUrl=x.images.standard_resolution.url)
      )
  }

  protected def fetchInstagramResponse(): String
}
