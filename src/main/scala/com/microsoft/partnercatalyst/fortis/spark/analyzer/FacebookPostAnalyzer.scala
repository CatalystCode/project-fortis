package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.github.catalystcode.fortis.spark.streaming.facebook.dto.FacebookPost
import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import java.util.Date

import scala.util.Try

@SerialVersionUID(100L)
class FacebookPostAnalyzer extends Analyzer[FacebookPost] with Serializable with Loggable
  with AnalysisDefaults.EnableAll[FacebookPost] {
  override def toSchema(item: FacebookPost, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[FacebookPost] = {
    ExtendedDetails(
      eventid = s"Facebook.post.${item.post.getId}",
      sourceeventid = item.post.getId,
      eventtime = Option(Option(item.post.getUpdatedTime).getOrElse(item.post.getCreatedTime)).getOrElse(new Date()).getTime,
      body = Option(item.post.getMessage).getOrElse(""),
      title = Option(item.post.getCaption).getOrElse(""),
      imageurl = Option(item.post.getIcon) match {
        case Some(icon) => Option(icon.toString)
        case None => Some("")
      },
      externalsourceid = item.pageId,
      pipelinekey = "Facebook",
      sharedLocations = Option(item.post.getPlace).map(_.getLocation) match {
        case Some(location) => locationFetcher(location.getLatitude, location.getLongitude).toList
        case None => List()
      },
      sourceurl = Try(item.post.getPermalinkUrl.toString)
        .getOrElse(s"https://www.facebook.com/${item.pageId}/posts/${item.post.getId}"),
      original = item
    )
  }
}