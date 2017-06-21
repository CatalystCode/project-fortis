package com.microsoft.partnercatalyst.fortis.spark.pipeline

import com.microsoft.partnercatalyst.fortis.spark.dto.AnalyzedItem
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
      val bodyKewords = keywordExtractor.extractKeywords(analyzedItem.body)
      val titleKeywords = keywordExtractor.extractKeywords(analyzedItem.title)
      val keywords = titleKeywords ::: bodyKewords
      analyzedItem.copy(analysis = analyzedItem.analysis.copy(keywords = keywords ::: analyzedItem.analysis.keywords))
    })
    .map(analyzedItem => {
      // analyze sentiment
      val sentiments = sentimentDetector.detectSentiment(analyzedItem.body, analyzedItem.analysis.language.getOrElse("")).map(List(_)).getOrElse(List())
      analyzedItem.copy(analysis = analyzedItem.analysis.copy(sentiments = sentiments ::: analyzedItem.analysis.sentiments))
    })
    .map(analyzedItem => {
      // infer locations from text
      val locations = locationsExtractor.analyze(analyzedItem.body, analyzedItem.analysis.language).toList
      analyzedItem.copy(analysis = analyzedItem.analysis.copy(locations = locations ::: analyzedItem.analysis.locations))
    })
  }
}
