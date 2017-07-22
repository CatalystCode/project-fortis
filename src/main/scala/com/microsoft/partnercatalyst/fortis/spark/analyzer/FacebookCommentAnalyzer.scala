package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.github.catalystcode.fortis.spark.streaming.facebook.dto.{FacebookComment}
import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer

@SerialVersionUID(100L)
class FacebookCommentAnalyzer extends Analyzer[FacebookComment] with Serializable with Loggable
  with AnalysisDefaults.EnableAll[FacebookComment] {
  override def toSchema(item: FacebookComment, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[FacebookComment] = {
    ExtendedDetails(
      eventid = item.comment.getId,
      eventtime = item.comment.getCreatedTime.getTime,
      body = item.comment.getMessage,
      title = String.format("Post %s: Comment", item.postId),
      externalsourceid = item.pageId,
      pipelinekey = "Facebook",
      sourceurl = String.format("https://www.facebook.com/%s/posts/%s", item.pageId, item.postId),
      original = item
    )
  }
}