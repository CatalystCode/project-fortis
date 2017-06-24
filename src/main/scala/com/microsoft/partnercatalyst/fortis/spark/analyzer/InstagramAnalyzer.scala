package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.github.catalystcode.fortis.spark.streaming.instagram.dto.InstagramItem
import com.microsoft.partnercatalyst.fortis.spark.dto._
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.LanguageDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractor
import com.microsoft.partnercatalyst.fortis.spark.transforms.people.PeopleRecognizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector

class InstagramAnalyzer extends Analyzer[InstagramItem]
  with AnalysisDefaults.EnableKeyword[InstagramItem] {
  override def toSchema(item: InstagramItem, locationsExtractor: LocationsExtractor, imageAnalyzer: ImageAnalyzer): ExtendedDetails[InstagramItem] = {
    val imageAnalysis = imageAnalyzer.analyze(item.images.standard_resolution.url)

    ExtendedDetails(
      body = imageAnalysis.summary.getOrElse(""),
      title = item.caption.text,
      sharedLocations = item.location match {
        case Some(location) => locationsExtractor.fetch(location.latitude, location.longitude).toList
        case None => List()
      },
      source = item.link,
      original = item
    )
  }

  override def detectLanguage(details: ExtendedDetails[InstagramItem], languageDetector: LanguageDetector): Option[String] = None
  override def detectSentiment(details: ExtendedDetails[InstagramItem], sentimentDetector: SentimentDetector): List[Double] = List()
  override def extractLocations(details: ExtendedDetails[InstagramItem], locationsExtractor: LocationsExtractor): List[Location] = List()
  override def extractEntities(details: ExtendedDetails[InstagramItem], peopleRecognizer: PeopleRecognizer): List[Tag] = List()
}
