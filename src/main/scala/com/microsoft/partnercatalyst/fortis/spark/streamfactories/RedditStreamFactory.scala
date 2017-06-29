package com.microsoft.partnercatalyst.fortis.spark.streamfactories

import com.github.catalystcode.fortis.spark.streaming.reddit.dto.RedditObject
import com.github.catalystcode.fortis.spark.streaming.reddit.{RedditAuth, RedditUtils}
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamFactory}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

class RedditStreamFactory extends StreamFactory[RedditObject]{
  override def createStream(streamingContext: StreamingContext): PartialFunction[ConnectorConfig, DStream[RedditObject]] = {
    case ConnectorConfig("RedditObject", params) =>
      val auth = RedditAuth(params("applicationId"), params("applicationSecret"))
      val keywords = params("keywords").split('|')

      val subreddit = if (params.contains("subreddit")) Option(params("subreddit")) else None
      val searchLimit = if (params.contains("searchLimit")) params("searchLimit").toInt else 25
      val searchResultType = if (params.contains("searchResultType")) Option(params("searchResultType")) else Option("link")
      RedditUtils.createPageStream(
        auth,
        keywords.toSeq,
        streamingContext,
        subredit = subreddit,
        searchLimit = searchLimit,
        searchResultType = searchResultType
      )
  }
}
