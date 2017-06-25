package com.microsoft.partnercatalyst.fortis.spark.analyzer

import java.util.UUID.randomUUID
import java.time.Instant.now

import com.github.catalystcode.fortis.spark.streaming.facebook.dto.FacebookPost
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer

@SerialVersionUID(100L)
class FacebookAnalyzer extends Analyzer[FacebookPost] with Serializable
  with AnalysisDefaults.EnableAll[FacebookPost] {
  override def toSchema(item: FacebookPost, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[FacebookPost] = {
    ExtendedDetails(
      id = randomUUID(),
      createdAtEpoch = now.getEpochSecond,
      body = item.post.getMessage,
      title = "",
      publisher = "Facebook",
      sourceUrl = item.post.getPermalinkUrl.toString,
      sharedLocations = Option(item.post.getPlace).map(_.getLocation) match {
        case Some(location) => locationFetcher(location.getLatitude, location.getLongitude).toList
        case None => List()
      },
      original = item
    )
  }
}