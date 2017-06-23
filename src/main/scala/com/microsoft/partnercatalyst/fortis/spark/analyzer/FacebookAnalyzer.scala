package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.github.catalystcode.fortis.spark.streaming.facebook.dto.FacebookPost
import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, FortisItem}
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractor

class FacebookAnalyzer extends Analyzer[FacebookPost]
  with AnalyzerDefault.EnableAll[FacebookPost] {
  override def toSchema(item: FacebookPost, locationsExtractor: LocationsExtractor, imageAnalyzer: ImageAnalyzer): FortisItem = {
    FortisItem(
      body = item.post.getMessage,
      title = "",
      source = item.post.getPermalinkUrl.toString,
      sharedLocations = Option(item.post.getPlace).map(_.getLocation) match {
        case Some(location) => locationsExtractor.fetch(location.getLatitude, location.getLongitude).toList
        case None => List()
      },
      analysis = Analysis()
    )
  }
}
