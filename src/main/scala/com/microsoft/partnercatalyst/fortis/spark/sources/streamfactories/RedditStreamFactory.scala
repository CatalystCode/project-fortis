package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.github.catalystcode.fortis.spark.streaming.reddit.dto.RedditObject
import com.github.catalystcode.fortis.spark.streaming.reddit.{RedditAuth, RedditUtils}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.{ConnectorConfig, StreamFactory}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

class RedditStreamFactory extends StreamFactoryBase[RedditObject] {
  override protected def canHandle(connectorConfig: ConnectorConfig): Boolean = {
    connectorConfig.name == "RedditObject"
  }

  override protected def buildStream(streamingContext: StreamingContext, connectorConfig: ConnectorConfig): DStream[RedditObject] = {
    import ParameterExtensions._

    val params = connectorConfig.parameters
    val auth = RedditAuth(params.getAs[String]("applicationId"), params.getAs[String]("applicationSecret"))
    val keywords = params.getAs[String]("keywords").split('|')
    val subreddit = params.get("subreddit").asInstanceOf[Option[String]]
    val searchLimit = params.getOrElse("searchLimit", "25").asInstanceOf[String].toInt
    val searchResultType = Some(params.getOrElse("searchResultType", "link").asInstanceOf[String])

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
