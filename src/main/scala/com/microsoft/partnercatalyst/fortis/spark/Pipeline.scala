package com.microsoft.partnercatalyst.fortis.spark

// TODO: remove this once transform context settings can be read from Cassandra
import com.microsoft.partnercatalyst.fortis.spark.ProjectFortis.Settings

import scala.reflect.runtime.universe.TypeTag
import com.microsoft.partnercatalyst.fortis.spark.analyzer.{Analyzer, AnalyzerItem}
import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, FortisItem}
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.StreamProvider
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.{ImageAnalysisAuth, ImageAnalyzer}
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.{LanguageDetector, LanguageDetectorAuth}
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.{Geofence, LocationsExtractor, PlaceRecognizer}
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.people.PeopleRecognizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.{SentimentDetector, SentimentDetectorAuth}
import com.microsoft.partnercatalyst.fortis.spark.transforms.topic.KeywordExtractor
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

object Pipeline {
  def apply[T: TypeTag](name: String, analyzer: Analyzer[T], ssc: StreamingContext, streamProvider: StreamProvider, configurationManager: ConfigurationManager): Option[DStream[FortisItem]] = {
    val configs = configurationManager.fetchStreamConfiguration(name)
    val sourceStream = streamProvider.buildStream[T](ssc, configs)

    sourceStream.map(_.transform(rdd => {

      // TODO: replace with global update/broadcast wrappers which will update and (where applicable) broadcast
      val geofence = Geofence(north = 49.6185146245, west = -124.9578052195, south = 46.8691952854, east = -121.0945042053)
      val placeRecognizer = new PlaceRecognizer(Settings.modelsDir)
      val peopleRecognizer = new PeopleRecognizer(Settings.modelsDir)
      val featureServiceClient = new FeatureServiceClient(Settings.featureServiceHost)
      val locationsExtractor = new LocationsExtractor(featureServiceClient, geofence, Some(placeRecognizer)).buildLookup()
      val keywordExtractor = new KeywordExtractor(List("Ariana"))
      val imageAnalyzer = new ImageAnalyzer(ImageAnalysisAuth(Settings.oxfordVisionToken), featureServiceClient)
      val languageDetector = new LanguageDetector(LanguageDetectorAuth(Settings.oxfordLanguageToken))
      val sentimentDetector = new SentimentDetector(SentimentDetectorAuth(Settings.oxfordLanguageToken))
      val supportedLanguages = Set("en", "fr", "de")

      rdd
        .map(item => AnalyzerItem(item, analyzer.toSchema(item, locationsExtractor, imageAnalyzer)))
        .map(item => item.copy(
          analyzedItem = item.analyzedItem.copy(
            analysis = Analysis(language = analyzer.detectLanguage(item, languageDetector))
          )
        ))
        .filter(item =>
          item.analyzedItem.analysis.language match {
            case Some(language) => supportedLanguages.contains(language)
            case None => false
          }
        )
        .map(item => item.copy(
          analyzedItem = item.analyzedItem.copy(
            analysis = item.analyzedItem.analysis.copy(
              keywords = analyzer.extractKeywords(item, keywordExtractor)
            )
          )
        ))
        .filter(item => item.analyzedItem.analysis.keywords.nonEmpty)
        .map(item => item.copy(
          analyzedItem = item.analyzedItem.copy(
            analysis = item.analyzedItem.analysis.copy(
              entities = analyzer.extractEntities(item, peopleRecognizer),
              sentiments = analyzer.detectSentiment(item, sentimentDetector),
              locations = analyzer.extractLocations(item, locationsExtractor)
            )
          )
        ))
        .map(item => item.analyzedItem)
    }))
  }
}