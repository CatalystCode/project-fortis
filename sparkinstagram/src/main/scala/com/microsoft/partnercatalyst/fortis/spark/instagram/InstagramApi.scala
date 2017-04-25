package com.microsoft.partnercatalyst.fortis.spark.instagram

import com.microsoft.partnercatalyst.fortis.spark.Schedule
import org.apache.spark.storage.StorageLevel
import scala.io.Source

case class Tag(name: String)

class InstagramTagReceiver(
  auth: InstagramContext,
  tag: Tag,
  schedule: Schedule,
  storageLevel: StorageLevel = StorageLevel.MEMORY_ONLY,
  numWorkers: Int = 1
)  extends InstagramReceiver(schedule, storageLevel, numWorkers) {

  override protected def fetchInstagramResponse(): String = {
    val url = s"https://${auth.apiHost}/v1/tags/${tag.name}/media/recent?access_token=${auth.accessToken}"
    Source.fromURL(url).mkString
  }
}


case class Location(lat: Double, lng: Double, radiusMeters: Int = 1000)

class InstagramLocationReceiver(
  auth: InstagramContext,
  location: Location,
  schedule: Schedule,
  storageLevel: StorageLevel = StorageLevel.MEMORY_ONLY,
  numWorkers: Int = 1
)  extends InstagramReceiver(schedule, storageLevel, numWorkers) {

  override protected def fetchInstagramResponse(): String = {
    val url = s"https://${auth.apiHost}/v1/media/search?lat=${location.lat}&lng=${location.lng}&access_token=${auth.accessToken}"
    Source.fromURL(url).mkString
  }
}
