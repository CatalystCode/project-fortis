package com.microsoft.partnercatalyst.fortis.spark.pipeline

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, AnalyzedItem}
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamProvider}
import com.microsoft.partnercatalyst.fortis.spark.tadaweb.dto.TadawebEvent
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

object TadawebPipeline extends Pipeline {
  override def apply(streamProvider: StreamProvider, streamRegistry: Map[String, List[ConnectorConfig]], ssc: StreamingContext, transformContext: TransformContext): Option[DStream[AnalyzedItem]] = {
    streamProvider.buildStream[TadawebEvent](ssc, streamRegistry("tadaweb")).map(stream =>
      TextPipeline(convertToSchema(stream, transformContext), transformContext))
  }

  private def convertToSchema(stream: DStream[TadawebEvent], transformContext: TransformContext): DStream[AnalyzedItem] = {
    import transformContext._

    stream.map(tada => AnalyzedItem(
      body = tada.text,
      title = tada.title,
      publisher = "TadaWeb",
      sourceUrl = tada.tada.name,
      sharedLocations = tada.cities.flatMap(city => city.coordinates match {
        case Seq(latitude, longitude) => locationsExtractor.fetch(latitude, longitude)
        case _ => None
      }).toList,
      analysis = Analysis(
        sentiments = tada.sentiment match {
          case "negative" => List(SentimentDetector.Negative)
          case "neutral" => List(SentimentDetector.Neutral)
          case "positive" => List(SentimentDetector.Positive)
          case _ => List()}
      )))
  }
}