package com.microsoft.partnercatalyst.fortis.spark.pipeline

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, AnalyzedItem}
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamProvider}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream
import twitter4j.{Status => TwitterStatus}

object TwitterPipeline extends Pipeline {

  override def apply(streamProvider: StreamProvider, streamRegistry: Map[String, List[ConnectorConfig]], ssc: StreamingContext, transformContext: TransformContext): Option[DStream[AnalyzedItem]] = {
    streamProvider.buildStream[TwitterStatus](ssc, streamRegistry("twitter")).map(stream =>
      TextPipeline(convertToSchema(stream, transformContext), transformContext))
  }

  private def convertToSchema(stream: DStream[TwitterStatus], transformContext: TransformContext): DStream[AnalyzedItem] = {
    import transformContext._

    stream.map(tweet => AnalyzedItem(
      body = tweet.getText,
      title = "",
      publisher = "Twitter",
      sourceUrl = s"https://twitter.com/statuses/${tweet.getId}",
      sharedLocations = Option(tweet.getGeoLocation) match {
        case Some(location) => locationsExtractor.fetch(location.getLatitude, location.getLongitude).toList
        case None => List()},
      analysis = Analysis(
        language = Option(tweet.getLang)
      )))
  }
}