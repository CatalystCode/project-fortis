package com.microsoft.partnercatalyst.fortis.spark.pipeline

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, AnalyzedItem, FortisItem}
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamProvider}
import com.microsoft.partnercatalyst.fortis.spark.streamwrappers.radio.RadioTranscription
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

object RadioPipeline extends Pipeline {
  override def apply(streamProvider: StreamProvider, streamRegistry: Map[String, List[ConnectorConfig]])
    (implicit ssc: StreamingContext, transformContext: TransformContext): Option[DStream[FortisItem]] = {
    import transformContext._

    streamProvider.buildStream[RadioTranscription](ssc, streamRegistry("radio")).map(
      stream => stream
        .map(radioTranscription => {
          val language = Some(radioTranscription.language)
          val keywords = keywordExtractor.extractKeywords(radioTranscription.text)
          val analysis = Analysis(language = language, keywords = keywords)
          val source = radioTranscription.radioUrl
          AnalyzedItem(originalItem = radioTranscription, analysis = analysis, source = source)
        })
        .filter(analyzedRadio => {
          supportedLanguages.contains(analyzedRadio.analysis.language.getOrElse(""))
        })
        .map(analyzedRadio => {
          // sentiment detection
          val text = analyzedRadio.originalItem.text
          val language = analyzedRadio.analysis.language.getOrElse("")
          val inferredSentiment = sentimentDetector.detectSentiment(text, language).map(List(_)).getOrElse(List())
          analyzedRadio.copy(analysis = analyzedRadio.analysis.copy(sentiments = inferredSentiment ++ analyzedRadio.analysis.sentiments))
        })
        .map(analyzedRadio => {
          // infer locations from text
          val inferredLocations = locationsExtractor.analyze(analyzedRadio.originalItem.text, analyzedRadio.analysis.language).toList
          analyzedRadio.copy(analysis = analyzedRadio.analysis.copy(locations = inferredLocations ++ analyzedRadio.analysis.locations))
        })
    )
  }
}