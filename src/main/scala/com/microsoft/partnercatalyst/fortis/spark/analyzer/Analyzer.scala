package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.dto.{Location, Tag}
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.LanguageDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractor
import com.microsoft.partnercatalyst.fortis.spark.transforms.people.PeopleRecognizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.summary.Summarizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.topic.{Blacklist, KeywordExtractor}

trait Analyzer[T] {
  type LocationFetcher = (Double, Double) => Iterable[Location]

  def toSchema(item: T, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[T]
  def hasBlacklistedTerms(details: ExtendedDetails[T], blacklist: Blacklist): Boolean
  def extractKeywords(details: ExtendedDetails[T], keywordExtractor: KeywordExtractor): List[Tag]
  def extractLocations(details: ExtendedDetails[T], locationsExtractor: LocationsExtractor): List[Location]
  def extractEntities(details: ExtendedDetails[T], peopleRecognizer: PeopleRecognizer): List[Tag]
  def detectLanguage(details: ExtendedDetails[T], languageDetector: LanguageDetector): Option[String]
  def detectSentiment(details: ExtendedDetails[T], sentimentDetector: SentimentDetector): List[Double]
  def createSummary(details: ExtendedDetails[T], summarizer: Summarizer): Option[String]
}