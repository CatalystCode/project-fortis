package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.dto.{FortisItem, Location, Tag}
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.LanguageDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractor
import com.microsoft.partnercatalyst.fortis.spark.transforms.people.PeopleRecognizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.topic.KeywordExtractor

trait Analyzer[T] {
  def toSchema(item: T, locationsExtractor: LocationsExtractor, imageAnalyzer: ImageAnalyzer): FortisItem
  def extractKeywords(item: AnalyzerItem[T], keywordExtractor: KeywordExtractor): List[Tag]
  def extractLocations(item: AnalyzerItem[T], locationsExtractor: LocationsExtractor): List[Location]
  def extractEntities(item: AnalyzerItem[T], peopleRecognizer: PeopleRecognizer): List[Tag]
  def detectLanguage(item: AnalyzerItem[T], languageDetector: LanguageDetector): Option[String]
  def detectSentiment(item: AnalyzerItem[T], sentimentDetector: SentimentDetector): List[Double]
}

/**
  * Provides default analysis method implementations for a concrete [[Analyzer]].
  *
  * By implementing these traits, the concrete [[Analyzer]] explicitly enables the default implementations that are
  * applicable to it. If a default is not enabled, the compiler will enforce that a custom implementation is provided.
  *
  */
object AnalyzerDefault {
  trait EnableAll[T] extends EnableKeyword[T]
    with EnableLocation[T]
    with EnableEntity[T]
    with EnableLanguage[T]
    with EnableSentiment[T] {
    this: Analyzer[T] =>
  }

  trait EnableKeyword[T] {
    this: Analyzer[T] =>
    override def extractKeywords(item: AnalyzerItem[T], keywordExtractor: KeywordExtractor): List[Tag] = {
      keywordExtractor.extractKeywords(item.analyzedItem.title) ::: keywordExtractor.extractKeywords(item.analyzedItem.body)
    }
  }

  trait EnableLocation[T] {
    this: Analyzer[T] =>
    override def extractLocations(item: AnalyzerItem[T], locationsExtractor: LocationsExtractor): List[Location] = {
      locationsExtractor.analyze(item.analyzedItem.body, item.analyzedItem.analysis.language).toList
    }
  }

  trait EnableEntity[T] {
    this: Analyzer[T] =>
    override def extractEntities(item: AnalyzerItem[T], peopleRecognizer: PeopleRecognizer): List[Tag] = {
      val analyzedItem = item.analyzedItem
      val bodyEntities = peopleRecognizer.extractPeople(analyzedItem.body, analyzedItem.analysis.language.getOrElse(""))
      val titleEntities = peopleRecognizer.extractPeople(analyzedItem.title, analyzedItem.analysis.language.getOrElse(""))
      (titleEntities ::: bodyEntities).map(entity => Tag(entity, confidence = None))
    }
  }

  trait EnableLanguage[T] {
    this: Analyzer[T] =>
    override def detectLanguage(item: AnalyzerItem[T], languageDetector: LanguageDetector): Option[String] = {
      languageDetector.detectLanguage(item.analyzedItem.body)
    }
  }

  trait EnableSentiment[T] {
    this: Analyzer[T] =>
    override def detectSentiment(item: AnalyzerItem[T], sentimentDetector: SentimentDetector): List[Double] = {
      sentimentDetector.detectSentiment(item.analyzedItem.body, item.analyzedItem.analysis.language.getOrElse("")).toList
    }
  }
}