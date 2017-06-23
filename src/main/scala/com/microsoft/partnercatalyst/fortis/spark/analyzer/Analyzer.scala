package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.dto.{Location, Tag}
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.LanguageDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractor
import com.microsoft.partnercatalyst.fortis.spark.transforms.people.PeopleRecognizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.topic.KeywordExtractor

trait Analyzer[T] {
  def toSchema(item: T, locationsExtractor: LocationsExtractor, imageAnalyzer: ImageAnalyzer): AnalyzerMessage[T]
  def extractKeywords(item: AnalyzerMessage[T], keywordExtractor: KeywordExtractor): List[Tag]
  def extractLocations(item: AnalyzerMessage[T], locationsExtractor: LocationsExtractor): List[Location]
  def extractEntities(item: AnalyzerMessage[T], peopleRecognizer: PeopleRecognizer): List[Tag]
  def detectLanguage(item: AnalyzerMessage[T], languageDetector: LanguageDetector): Option[String]
  def detectSentiment(item: AnalyzerMessage[T], sentimentDetector: SentimentDetector): List[Double]
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
    override def extractKeywords(item: AnalyzerMessage[T], keywordExtractor: KeywordExtractor): List[Tag] = {
      keywordExtractor.extractKeywords(item.title) ::: keywordExtractor.extractKeywords(item.body)
    }
  }

  trait EnableLocation[T] {
    this: Analyzer[T] =>
    override def extractLocations(item: AnalyzerMessage[T], locationsExtractor: LocationsExtractor): List[Location] = {
      locationsExtractor.analyze(item.body, item.analysis.language).toList
    }
  }

  trait EnableEntity[T] {
    this: Analyzer[T] =>
    override def extractEntities(item: AnalyzerMessage[T], peopleRecognizer: PeopleRecognizer): List[Tag] = {
      val bodyEntities = peopleRecognizer.extractPeople(item.body, item.analysis.language.getOrElse(""))
      val titleEntities = peopleRecognizer.extractPeople(item.title, item.analysis.language.getOrElse(""))
      (titleEntities ::: bodyEntities).map(entity => Tag(entity, confidence = None))
    }
  }

  trait EnableLanguage[T] {
    this: Analyzer[T] =>
    override def detectLanguage(item: AnalyzerMessage[T], languageDetector: LanguageDetector): Option[String] = {
      languageDetector.detectLanguage(item.body)
    }
  }

  trait EnableSentiment[T] {
    this: Analyzer[T] =>
    override def detectSentiment(item: AnalyzerMessage[T], sentimentDetector: SentimentDetector): List[Double] = {
      sentimentDetector.detectSentiment(item.body, item.analysis.language.getOrElse("")).toList
    }
  }
}