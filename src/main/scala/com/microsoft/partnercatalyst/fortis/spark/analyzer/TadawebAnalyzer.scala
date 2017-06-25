package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.tadaweb.dto.TadawebEvent
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector

class TadawebAnalyzer extends Analyzer[TadawebEvent]
  with AnalysisDefaults.EnableAll[TadawebEvent] {
  override def toSchema(item: TadawebEvent, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[TadawebEvent] = {
    ExtendedDetails(
      body = item.text,
      title = item.title,
      source = item.tada.name,
      sharedLocations = item.cities.flatMap(city => city.coordinates match {
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