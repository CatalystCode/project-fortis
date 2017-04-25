package com.microsoft.partnercatalyst.fortis.spark.instagram

import com.microsoft.partnercatalyst.fortis.spark.instagram.dto.{Image, Instagram, JsonInstagramResponse}
import com.microsoft.partnercatalyst.fortis.spark.{PollingReceiver, Schedule}
import net.liftweb.json
import net.liftweb.json.DefaultFormats
import org.apache.spark.storage.StorageLevel

case class InstagramContext(accessToken: String, apiHost: String = "api.instagram.com")

abstract class InstagramReceiver(schedule: Schedule, storageLevel: StorageLevel, numWorkers: Int)
  extends PollingReceiver[Instagram](schedule, storageLevel, numWorkers) {

  implicit val formats = DefaultFormats

  @volatile private var lastIngestedTimestamp = Long.MinValue

  override protected def poll(): Unit = {
    loadNewInstagrams()
    .foreach(x => {
      store(x)
      lastIngestedTimestamp = Math.max(x.createdAtEpoch, lastIngestedTimestamp)
    })
  }

  protected def loadNewInstagrams(): Seq[Instagram] = {
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
    .filter(x => x.createdAtEpoch > lastIngestedTimestamp)
  }

  protected def fetchInstagramResponse(): String
}
