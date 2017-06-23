package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.github.catalystcode.fortis.spark.streaming.instagram.dto.InstagramItem
import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, AnalyzedItem, Location, Tag}
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.LanguageDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractor
import com.microsoft.partnercatalyst.fortis.spark.transforms.people.PeopleRecognizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector

class InstagramAnalyzer extends Analyzer[InstagramItem]
  with AnalyzerDefault.EnableKeyword[InstagramItem] {
  override def toSchema(item: InstagramItem, locationsExtractor: LocationsExtractor, imageAnalyzer: ImageAnalyzer): AnalyzedItem = {
    val imageAnalysis = imageAnalyzer.analyze(item.images.standard_resolution.url)

    AnalyzedItem(
      body = imageAnalysis.summary.getOrElse(""),
      title = item.caption.text,
      sharedLocations = item.location match {
        case Some(location) => locationsExtractor.fetch(location.latitude, location.longitude).toList
        case None => List()
      },
      source = item.link,
      analysis = Analysis()
    )
  }

  override def detectLanguage(item: AnalyzerItem[InstagramItem], languageDetector: LanguageDetector): Option[String] = None
  override def detectSentiment(item: AnalyzerItem[InstagramItem], sentimentDetector: SentimentDetector): List[Double] = List()
  override def extractLocations(item: AnalyzerItem[InstagramItem], locationsExtractor: LocationsExtractor): List[Location] = List()
  override def extractEntities(item: AnalyzerItem[InstagramItem], peopleRecognizer: PeopleRecognizer): List[Tag] = List()
}
