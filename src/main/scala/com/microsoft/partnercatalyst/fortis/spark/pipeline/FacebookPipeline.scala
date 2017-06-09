package com.microsoft.partnercatalyst.fortis.spark.pipeline

import com.github.catalystcode.fortis.spark.streaming.facebook.dto.FacebookPost
import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, AnalyzedItem, FortisItem}
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamProvider}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

object FacebookPipeline extends Pipeline {
  override def apply(streamProvider: StreamProvider, streamRegistry: Map[String, List[ConnectorConfig]])
    (implicit ssc: StreamingContext, transformContext: TransformContext): Option[DStream[FortisItem]] = {
    import transformContext._

    streamProvider.buildStream[FacebookPost](ssc, streamRegistry("facebook")).map(
      stream => stream
        .map(post => {
          val source = post.post.getPermalinkUrl.toString
          val language = languageDetector.detectLanguage(post.post.getMessage)
          val analysis = Analysis(language = language, keywords = keywordExtractor.extractKeywords(post.post.getMessage))
          AnalyzedItem(originalItem = post, analysis = analysis, source = source)
        })
        .filter(analyzedPost => {
          supportedLanguages.contains(analyzedPost.analysis.language.getOrElse(""))
        })
        .map(analyzedPost => {
          // sentiment detection
          val text = analyzedPost.originalItem.post.getMessage
          val language = analyzedPost.analysis.language.getOrElse("")
          val inferredSentiment = sentimentDetector.detectSentiment(text, language).map(List(_)).getOrElse(List())
          analyzedPost.copy(analysis = analyzedPost.analysis.copy(sentiments = inferredSentiment ++ analyzedPost.analysis.sentiments))
        })
        .map(analyzedPost => {
          // map tagged locations to location features
          var analyzed = analyzedPost
          val place = Option(analyzed.originalItem.post.getPlace)
          val location = if (place.isDefined) Some(place.get.getLocation) else None
          if (location.isDefined) {
            val lat = location.get.getLatitude
            val lng = location.get.getLongitude
            val sharedLocations = locationsExtractor.fetch(latitude = lat, longitude = lng).toList
            analyzed = analyzed.copy(sharedLocations = sharedLocations ++ analyzed.sharedLocations)
          }
          analyzed
        })
        .map(analyzedPost => {
          // infer locations from text
          val inferredLocations = locationsExtractor.analyze(analyzedPost.originalItem.post.getMessage, analyzedPost.analysis.language).toList
          analyzedPost.copy(analysis = analyzedPost.analysis.copy(locations = inferredLocations ++ analyzedPost.analysis.locations))
        })
    )
  }
}