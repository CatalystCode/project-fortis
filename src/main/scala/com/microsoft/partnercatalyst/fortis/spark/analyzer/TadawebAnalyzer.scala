package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, AnalyzedItem}
import com.microsoft.partnercatalyst.fortis.spark.tadaweb.dto.TadawebEvent
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractor
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector

class TadawebAnalyzer extends Analyzer[TadawebEvent]
  with AnalyzerDefault.EnableAll[TadawebEvent] {
  override def toSchema(item: TadawebEvent, locationsExtractor: LocationsExtractor, imageAnalyzer: ImageAnalyzer): AnalyzedItem = {
    AnalyzedItem(
      body = item.text,
      title = item.title,
      source = item.tada.name,
      sharedLocations = item.cities.flatMap(city => city.coordinates match {
        case Seq(latitude, longitude) => locationsExtractor.fetch(latitude, longitude)
        case _ => None
      }).toList,
      analysis = Analysis()
    )
  }

  override def detectSentiment(item: AnalyzerItem[TadawebEvent], sentimentDetector: SentimentDetector): List[Double] = {
    item.original.sentiment match {
      case "negative" => List(SentimentDetector.Negative)
      case "neutral" => List(SentimentDetector.Neutral)
      case "positive" => List(SentimentDetector.Positive)
      case _ => super.detectSentiment(item, sentimentDetector)
    }
  }
}
