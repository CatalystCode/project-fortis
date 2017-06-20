package com.microsoft.partnercatalyst.fortis.spark.pipeline

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, AnalyzedItem, FortisItem}
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamProvider}
import com.microsoft.partnercatalyst.fortis.spark.tadaweb.dto.TadawebEvent
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

object TadawebPipeline extends Pipeline {
  override def apply(streamProvider: StreamProvider, streamRegistry: Map[String, List[ConnectorConfig]],
    ssc: StreamingContext, transformContext: TransformContext): Option[DStream[FortisItem]] = {
    import transformContext._

    streamProvider.buildStream[TadawebEvent](ssc, streamRegistry("tadaweb")).map(
      stream => stream
        .map(event => AnalyzedItem(
          event,
          source = event.tada.name,
          analysis = Analysis(keywords =
            keywordExtractor.extractKeywords(event.text) ::: keywordExtractor.extractKeywords(event.title)
          )
        ))
        .filter(_.analysis.keywords.nonEmpty)
        .map(fortisEvent => {
          val language = languageDetector.detectLanguage(fortisEvent.originalItem.text)
          val sentiment: Option[Double] = fortisEvent.originalItem.sentiment match {
            case "negative" => Some(SentimentDetector.Negative)
            case "neutral" => Some(SentimentDetector.Neutral)
            case "positive" => Some(SentimentDetector.Positive)
            case _ => language match {
              case Some(lang) =>
                sentimentDetector.detectSentiment(fortisEvent.originalItem.text, lang)
              case None => None
            }
          }

          fortisEvent.copy(
            analysis = fortisEvent.analysis.copy(
              language = language,
              sentiments = sentiment.toList ::: fortisEvent.analysis.sentiments
            )
          )
        })
        .filter(_.analysis.sentiments.nonEmpty)
        .map(fortisEvent => {
          val sharedLocations = fortisEvent.originalItem.cities.flatMap(city =>
            city.coordinates match {
              case Seq(latitude, longitude) => locationsExtractor.fetch(latitude = latitude, longitude = longitude)
              case _ => None
            }
          ).toList

          fortisEvent.copy(
            sharedLocations = sharedLocations ::: fortisEvent.sharedLocations
          )
        })
        .map(fortisEvent => {
          val inferredLocations = locationsExtractor.analyze(fortisEvent.originalItem.text, fortisEvent.analysis.language)

          fortisEvent.copy(
            analysis = fortisEvent.analysis.copy(
              locations = inferredLocations.toList ::: fortisEvent.analysis.locations
            )
          )
        })
    )
  }
}