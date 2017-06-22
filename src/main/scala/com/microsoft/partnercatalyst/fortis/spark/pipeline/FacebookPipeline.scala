package com.microsoft.partnercatalyst.fortis.spark.pipeline

import java.time.Instant.now

import com.github.catalystcode.fortis.spark.streaming.facebook.dto.FacebookPost
import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, AnalyzedItem}
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamProvider}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

object FacebookPipeline extends Pipeline {

  override def apply(streamProvider: StreamProvider, streamRegistry: Map[String, List[ConnectorConfig]], ssc: StreamingContext, transformContext: TransformContext): Option[DStream[AnalyzedItem]] = {
    streamProvider.buildStream[FacebookPost](ssc, streamRegistry("facebook")).map(stream =>
      TextPipeline(convertToSchema(stream, transformContext), transformContext))
  }

  private def convertToSchema(stream: DStream[FacebookPost], transformContext: TransformContext): DStream[AnalyzedItem] = {
    import transformContext._

    stream.map(post => AnalyzedItem(
      createdAtEpoch = now.getEpochSecond,
      body = post.post.getMessage,
      title = "",
      publisher = "Facebook",
      sourceUrl = post.post.getPermalinkUrl.toString,
      sharedLocations = Option(post.post.getPlace).map(_.getLocation) match {
        case Some(location) => locationsExtractor.fetch(location.getLatitude, location.getLongitude).toList
        case None => List()},
      analysis = Analysis()
    ))
  }
}