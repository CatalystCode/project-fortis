package com.microsoft.partnercatalyst.fortis.spark.instagram.client

import scala.io.Source

case class Tag(name: String)

class InstagramTagClient(tag: Tag, auth: InstagramContext) extends InstagramClient(auth) {
  override protected def fetchInstagramResponse(): String = {
    val url = s"https://${auth.apiHost}/v1/tags/${tag.name}/media/recent?access_token=${auth.accessToken}"
    Source.fromURL(url).mkString
  }
}
