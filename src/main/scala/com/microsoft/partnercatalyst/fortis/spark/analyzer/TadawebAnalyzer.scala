package com.microsoft.partnercatalyst.fortis.spark.analyzer

import java.time.Instant.now
import com.microsoft.partnercatalyst.fortis.spark.sources.streamwrappers.tadaweb.TadawebEvent
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector

@SerialVersionUID(100L)
class TadawebAnalyzer extends Analyzer[TadawebEvent] with Serializable
  with AnalysisDefaults.EnableAll[TadawebEvent] {
  override def toSchema(item: TadawebEvent, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[TadawebEvent] = {
    ExtendedDetails(
      id = item.tada.id,
      externalsourceid = item.tada.name,
      eventtime = now.getEpochSecond,
      body = item.text,
      title = item.title,
      pipelinekey = "TadaWeb",
      sourceurl = item.link,
      sharedlocations = item.cities.flatMap(city => city.coordinates match {
        case Seq(latitude, longitude) => locationFetcher(latitude, longitude)
        case _ => None
      }).toList,
      original = item
    )
  }

  override def detectSentiment(details: ExtendedDetails[TadawebEvent], sentimentDetector: SentimentDetector): List[Double] = {
    details.original.sentiment match {
      case "negative" => List(SentimentDetector.Negative)
      case "neutral" => List(SentimentDetector.Neutral)
      case "positive" => List(SentimentDetector.Positive)
      case _ => super.detectSentiment(details, sentimentDetector)
    }
  }
}