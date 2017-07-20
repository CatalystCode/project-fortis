package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.github.catalystcode.fortis.spark.streaming.facebook.dto.FacebookPost
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer

@SerialVersionUID(100L)
class FacebookPostAnalyzer extends Analyzer[FacebookPost] with Serializable
  with AnalysisDefaults.EnableAll[FacebookPost] {
  override def toSchema(item: FacebookPost, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[FacebookPost] = {
    ExtendedDetails(
      id = item.post.getId,
      eventtime = item.post.getUpdatedTime.getTime,
      body = item.post.getMessage,
      title = item.post.getCaption,
      externalsourceid = item.post.getSource.toString,
      pipelinekey = "Facebook",
      sourceUrl = item.post.getPermalinkUrl.toString,
      sharedLocations = Option(item.post.getPlace).map(_.getLocation) match {
        case Some(location) => locationFetcher(location.getLatitude, location.getLongitude).toList
        case None => List()
      },
      original = item
    )
  }
}