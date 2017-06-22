package com.microsoft.partnercatalyst.fortis.spark.pipeline

import com.microsoft.partnercatalyst.fortis.spark.dto.{AnalyzedItem, Tag}
import org.apache.spark.streaming.dstream.DStream

object TextPipeline {
  def apply(stream: DStream[AnalyzedItem], transformContext: TransformContext): DStream[AnalyzedItem] = {
    import transformContext._

    stream
    .map(analyzedItem => {
      // language inference
      analyzedItem.analysis.language match {
        case Some(_) => analyzedItem
        case None =>
          val language = languageDetector.detectLanguage(analyzedItem.body)
          analyzedItem.copy(analysis = analyzedItem.analysis.copy(language = language))
      }
    })
    .filter(analyzedItem => {
      // restrict to supported languages
      analyzedItem.analysis.language match {
        case None => false
        case Some(language) => supportedLanguages.contains(language)
      }
    })
    .map(analyzedItem => {
      // keywords extraction
      analyzedItem.analysis.keywords.length match {
        case 0 =>
          val bodyKewords = keywordExtractor.extractKeywords(analyzedItem.body)
          val titleKeywords = keywordExtractor.extractKeywords(analyzedItem.title)
          val keywords = titleKeywords ::: bodyKewords
          analyzedItem.copy(analysis = analyzedItem.analysis.copy(keywords = keywords))
        case _ => analyzedItem
      }
    })
    .map(analyzedItem => {
      // people extraction
      analyzedItem.analysis.entities.length match {
        case 0 =>
          val bodyEntities = peopleRecognizer.extractPeople(analyzedItem.body, analyzedItem.analysis.language.getOrElse(""))
          val titleEntities = peopleRecognizer.extractPeople(analyzedItem.title, analyzedItem.analysis.language.getOrElse(""))
          val entities = (titleEntities ::: bodyEntities).map(entity => Tag(entity, confidence = None))
          analyzedItem.copy(analysis = analyzedItem.analysis.copy(entities = entities))
        case _ => analyzedItem
      }
    })
    .map(analyzedItem => {
      // analyze sentiment
      analyzedItem.analysis.sentiments.length match {
        case 0 =>
          val sentiments = sentimentDetector.detectSentiment(analyzedItem.body, analyzedItem.analysis.language.getOrElse("")).map(List(_)).getOrElse(List())
          analyzedItem.copy(analysis = analyzedItem.analysis.copy(sentiments = sentiments))
        case _ => analyzedItem
      }
    })
    .map(analyzedItem => {
      // infer locations from text
      analyzedItem.analysis.locations.length match {
        case 0 =>
          val locations = locationsExtractor.analyze(analyzedItem.body, analyzedItem.analysis.language).toList
          analyzedItem.copy(analysis = analyzedItem.analysis.copy(locations = locations))
        case _ => analyzedItem
      }
    })
  }
}
