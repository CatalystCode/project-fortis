package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, Location, Tag}
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.LanguageDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractor
import com.microsoft.partnercatalyst.fortis.spark.transforms.people.PeopleRecognizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.summary.Summarizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.topic.{Blacklist, KeywordExtractor}

/**
  * Provides default analysis method implementations for a concrete [[Analyzer]].
  *
  * By implementing these traits, the concrete [[Analyzer]] explicitly enables the default implementations that are
  * applicable to it. If a default is not enabled, the compiler will enforce that a custom implementation is provided.
  *
  */
private[analyzer] object AnalysisDefaults {
  trait EnableAll[T] extends EnableKeyword[T]
    with EnableLocation[T]
    with EnableEntity[T]
    with EnableLanguage[T]
    with EnableBlacklist[T]
    with EnableEntitiesBlacklist[T]
    with EnableSummary[T]
    with EnableSentiment[T] {
    this: Analyzer[T] =>
  }

  trait EnableKeyword[T] {
    this: Analyzer[T] =>
    override def extractKeywords(details: ExtendedDetails[T], keywordExtractor: KeywordExtractor): List[Tag] = {
      keywordExtractor.extractKeywords(details.title) ::: keywordExtractor.extractKeywords(details.body)
    }
  }

  trait EnableLocation[T] {
    this: Analyzer[T] =>
    override def extractLocations(details: ExtendedDetails[T], locationsExtractor: LocationsExtractor): List[Location] = {
      val extractedLocations = locationsExtractor.analyze(details.body).toList
      if (details.sharedLocations == null || details.sharedLocations.isEmpty) {
        extractedLocations
      } else {
        details.sharedLocations ++ extractedLocations
      }
    }
  }

  trait EnableEntity[T] {
    this: Analyzer[T] =>
    override def extractEntities(details: ExtendedDetails[T], peopleRecognizer: PeopleRecognizer): List[Tag] = {
      if (!sys.env.getOrElse("FORTIS_ENTITY_RECOGNIZER_ENABLED", "false").toBoolean) {
        return List()
      }
      val bodyEntities = peopleRecognizer.extractPeople(details.body)
      val titleEntities = peopleRecognizer.extractPeople(details.title)
      (titleEntities ::: bodyEntities).map(entity => Tag(entity, confidence = None))
    }
  }

  trait EnableLanguage[T] {
    this: Analyzer[T] =>
    override def detectLanguage(details: ExtendedDetails[T], languageDetector: LanguageDetector): Option[String] = {
      languageDetector.detectLanguage(details.body)
    }
  }

  trait EnableSentiment[T] {
    this: Analyzer[T] =>
    override def detectSentiment(details: ExtendedDetails[T], sentimentDetector: SentimentDetector): List[Double] = {
      sentimentDetector.detectSentiment(details.body).toList
    }
  }

  trait EnableBlacklist[T] {
    this: Analyzer[T] =>
    override def hasBlacklistedTerms(details: ExtendedDetails[T], blacklist: Blacklist): Boolean = {
      blacklist.matches(details.body) || blacklist.matches(details.title)
    }
  }

  trait EnableEntitiesBlacklist[T] {
    this: Analyzer[T] =>
    override def hasBlacklistedEntities(analysis: Analysis, blacklist: Blacklist): Boolean = {
      val entities = analysis.entities.map(_.name).toSet
      blacklist.matches(entities)
    }
  }

  trait EnableSummary[T] {
    this: Analyzer[T] =>
    override def createSummary(details: ExtendedDetails[T], summarizer: Summarizer): Option[String] = {
      summarizer.summarize(details.body)
    }
  }
}