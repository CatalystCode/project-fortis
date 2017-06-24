package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.dto.{Location, Tag}
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.LanguageDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractor
import com.microsoft.partnercatalyst.fortis.spark.transforms.people.PeopleRecognizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.topic.KeywordExtractor

trait Analyzer[T] {
  def toSchema(item: T, locationsExtractor: LocationsExtractor, imageAnalyzer: ImageAnalyzer): ExtendedDetails[T]
  def extractKeywords(details: ExtendedDetails[T], keywordExtractor: KeywordExtractor): List[Tag]
  def extractLocations(details: ExtendedDetails[T], locationsExtractor: LocationsExtractor): List[Location]
  def extractEntities(details: ExtendedDetails[T], peopleRecognizer: PeopleRecognizer): List[Tag]
  def detectLanguage(details: ExtendedDetails[T], languageDetector: LanguageDetector): Option[String]
  def detectSentiment(details: ExtendedDetails[T], sentimentDetector: SentimentDetector): List[Double]
}