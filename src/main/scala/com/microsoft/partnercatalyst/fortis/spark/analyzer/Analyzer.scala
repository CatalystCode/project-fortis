package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.dto.{AnalyzedItem, Location, Tag}
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.LanguageDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractor
import com.microsoft.partnercatalyst.fortis.spark.transforms.people.PeopleRecognizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.topic.KeywordExtractor

trait Analyzer[T] {
  def toSchema(item: T, locationsExtractor: LocationsExtractor, imageAnalyzer: ImageAnalyzer): AnalyzedItem

  def extractKeywords(item: AnalyzerItem[T], keywordExtractor: KeywordExtractor): List[Tag] = {
    keywordExtractor.extractKeywords(item.analyzedItem.title) ::: keywordExtractor.extractKeywords(item.analyzedItem.body)
  }

  def extractLocations(item: AnalyzerItem[T], locationsExtractor: LocationsExtractor): List[Location] = {
    locationsExtractor.analyze(item.analyzedItem.body, item.analyzedItem.analysis.language).toList
  }

  def extractEntities(item: AnalyzerItem[T], peopleRecognizer: PeopleRecognizer): List[Tag] = {
    val analyzedItem = item.analyzedItem
    val bodyEntities = peopleRecognizer.extractPeople(analyzedItem.body, analyzedItem.analysis.language.getOrElse(""))
    val titleEntities = peopleRecognizer.extractPeople(analyzedItem.title, analyzedItem.analysis.language.getOrElse(""))
    (titleEntities ::: bodyEntities).map(entity => Tag(entity, confidence = None))
  }

  def detectLanguage(item: AnalyzerItem[T], languageDetector: LanguageDetector): Option[String] = {
    languageDetector.detectLanguage(item.analyzedItem.body)
  }

  def detectSentiment(item: AnalyzerItem[T], sentimentDetector: SentimentDetector): List[Double] = {
    sentimentDetector.detectSentiment(item.analyzedItem.body, item.analyzedItem.analysis.language.getOrElse("")).toList
  }
}
