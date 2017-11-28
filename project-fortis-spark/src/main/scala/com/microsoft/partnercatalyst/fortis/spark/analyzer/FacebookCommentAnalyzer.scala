package com.microsoft.partnercatalyst.fortis.spark.analyzer

import java.util.Date

import com.github.catalystcode.fortis.spark.streaming.facebook.dto.FacebookComment
import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer

@SerialVersionUID(100L)
class FacebookCommentAnalyzer extends Analyzer[FacebookComment] with Serializable with Loggable
  with AnalysisDefaults.EnableAll[FacebookComment] {
  override def toSchema(item: FacebookComment, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[FacebookComment] = {
    ExtendedDetails(
      eventid = s"Facebook.comment.${item.comment.getId}",
      sourceeventid = item.comment.getId,
      eventtime = Option(item.comment.getCreatedTime).getOrElse(new Date()).getTime,
      body = Option(item.comment.getMessage).getOrElse(""),
      title = s"Post ${item.postId}: Comment",
      externalsourceid = item.pageId,
      pipelinekey = "Facebook",
      imageurl = None,
      sourceurl = s"https://www.facebook.com/${item.pageId}/posts/${item.postId}",
      original = item
    )
  }
}