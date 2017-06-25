package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.github.catalystcode.fortis.spark.streaming.facebook.dto.FacebookPost
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer

class FacebookAnalyzer extends Analyzer[FacebookPost]
  with AnalysisDefaults.EnableAll[FacebookPost] {
  override def toSchema(item: FacebookPost, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[FacebookPost] = {
    ExtendedDetails(
      body = item.post.getMessage,
      title = "",
      source = item.post.getPermalinkUrl.toString,
      sharedLocations = Option(item.post.getPlace).map(_.getLocation) match {
        case Some(location) => locationFetcher(location.getLatitude, location.getLongitude).toList
        case None => List()
      },
      original = item
    )
  }
}
