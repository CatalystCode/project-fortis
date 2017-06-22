package com.microsoft.partnercatalyst.fortis.spark.pipeline

import com.microsoft.partnercatalyst.fortis.spark.dto.{AnalyzedItem, Tag}
import org.apache.spark.streaming.dstream.DStream

object TextPipeline {
  def apply(stream: DStream[AnalyzedItem], transformContext: TransformContext): DStream[AnalyzedItem] = {
    stream
    .map(inferLanguage(_, transformContext))
    .filter(isLanguageSupported(_, transformContext))
    .map(extractKeywords(_, transformContext))
    .map(extractEntities(_, transformContext))
    .map(analyzeSentiment(_, transformContext))
    .map(extractLocations(_, transformContext))
  }

  private def inferLanguage(analyzedItem: AnalyzedItem, transformContext: TransformContext): AnalyzedItem = {
    import transformContext.languageDetector

    analyzedItem.analysis.language match {
      case Some(_) => analyzedItem
      case None =>
        val language = languageDetector.detectLanguage(analyzedItem.body)
        analyzedItem.copy(analysis = analyzedItem.analysis.copy(language = language))
    }
  }

  private def isLanguageSupported(analyzedItem: AnalyzedItem, transformContext: TransformContext): Boolean = {
    import transformContext.supportedLanguages

    analyzedItem.analysis.language match {
      case None => false
      case Some(language) => supportedLanguages.contains(language)
    }
  }

  private def extractKeywords(analyzedItem: AnalyzedItem, transformContext: TransformContext): AnalyzedItem = {
    import transformContext.keywordExtractor

    analyzedItem.analysis.keywords.length match {
      case 0 =>
        val bodyKewords = keywordExtractor.extractKeywords(analyzedItem.body)
        val titleKeywords = keywordExtractor.extractKeywords(analyzedItem.title)
        val keywords = titleKeywords ::: bodyKewords
        analyzedItem.copy(analysis = analyzedItem.analysis.copy(keywords = keywords))
      case _ => analyzedItem
    }
  }

  private def extractEntities(analyzedItem: AnalyzedItem, transformContext: TransformContext): AnalyzedItem = {
    import transformContext.peopleRecognizer

    analyzedItem.analysis.entities.length match {
      case 0 =>
        val bodyEntities = peopleRecognizer.extractPeople(analyzedItem.body, analyzedItem.analysis.language.getOrElse(""))
        val titleEntities = peopleRecognizer.extractPeople(analyzedItem.title, analyzedItem.analysis.language.getOrElse(""))
        val entities = (titleEntities ::: bodyEntities).map(entity => Tag(entity, confidence = None))
        analyzedItem.copy(analysis = analyzedItem.analysis.copy(entities = entities))
      case _ => analyzedItem
    }
  }

  private def analyzeSentiment(analyzedItem: AnalyzedItem, transformContext: TransformContext): AnalyzedItem = {
    import transformContext.sentimentDetector

    analyzedItem.analysis.sentiments.length match {
      case 0 =>
        val sentiments = sentimentDetector.detectSentiment(analyzedItem.body, analyzedItem.analysis.language.getOrElse("")).map(List(_)).getOrElse(List())
        analyzedItem.copy(analysis = analyzedItem.analysis.copy(sentiments = sentiments))
      case _ => analyzedItem
    }
  }

  private def extractLocations(analyzedItem: AnalyzedItem, transformContext: TransformContext): AnalyzedItem = {
    import transformContext.locationsExtractor

    analyzedItem.analysis.locations.length match {
      case 0 =>
        val locations = locationsExtractor.analyze(analyzedItem.body, analyzedItem.analysis.language).toList
        analyzedItem.copy(analysis = analyzedItem.analysis.copy(locations = locations))
      case _ => analyzedItem
    }
  }
}
