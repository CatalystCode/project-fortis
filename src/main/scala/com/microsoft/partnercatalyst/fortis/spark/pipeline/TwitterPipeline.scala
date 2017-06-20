package com.microsoft.partnercatalyst.fortis.spark.pipeline

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, AnalyzedItem, FortisItem}
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamProvider}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream
import twitter4j.{Status => TwitterStatus}

object TwitterPipeline extends Pipeline {
  override def apply(streamProvider: StreamProvider, streamRegistry: Map[String, List[ConnectorConfig]],
    ssc: StreamingContext, transformContext: TransformContext): Option[DStream[FortisItem]] = {
    import transformContext._

    streamProvider.buildStream[TwitterStatus](ssc, streamRegistry("twitter")).map(
      stream => stream
        .map(tweet => {
          val source = s"https://twitter.com/statuses/${tweet.getId}"
          val language = if (Option(tweet.getLang).isDefined) { Option(tweet.getLang) } else { languageDetector.detectLanguage(tweet.getText) }
          val analysis = Analysis(language = language, keywords = keywordExtractor.extractKeywords(tweet.getText))
          AnalyzedItem(originalItem = tweet, analysis = analysis, source = source)
        })
        .filter(analyzedPost => {
          supportedLanguages.contains(analyzedPost.analysis.language.getOrElse(""))
        })
        .map(analyzedPost => {
          // sentiment detection
          val text = analyzedPost.originalItem.getText
          val language = analyzedPost.analysis.language.getOrElse("")
          val inferredSentiment = sentimentDetector.detectSentiment(text, language).map(List(_)).getOrElse(List())
          analyzedPost.copy(analysis = analyzedPost.analysis.copy(sentiments = inferredSentiment ++ analyzedPost.analysis.sentiments))
        })
        .map(analyzedTweet => {
          // map tagged locations to location features
          var analyzed = analyzedTweet
          val location = analyzed.originalItem.getGeoLocation
          if (location != null) {
            val lat = location.getLatitude
            val lng = location.getLongitude
            val sharedLocations = locationsExtractor.fetch(latitude = lat, longitude = lng).toList
            analyzed = analyzed.copy(sharedLocations = sharedLocations ++ analyzed.sharedLocations)
          }
          analyzed
        })
        .map(analyzedTweet => {
          // infer locations from text
          val inferredLocations = locationsExtractor.analyze(analyzedTweet.originalItem.getText, analyzedTweet.analysis.language).toList
          analyzedTweet.copy(analysis = analyzedTweet.analysis.copy(locations = inferredLocations ++ analyzedTweet.analysis.locations))
        })
    )
  }
}