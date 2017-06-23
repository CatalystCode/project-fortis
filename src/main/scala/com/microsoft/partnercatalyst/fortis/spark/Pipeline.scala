package com.microsoft.partnercatalyst.fortis.spark

// TODO: remove this once transform context settings can be read from Cassandra
import com.microsoft.partnercatalyst.fortis.spark.ProjectFortis.Settings

import scala.reflect.runtime.universe.TypeTag
import com.microsoft.partnercatalyst.fortis.spark.analyzer.{Analyzer, AnalyzerOutput}
import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, FortisAnalysis}
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
  def apply[T: TypeTag](name: String, analyzer: Analyzer[T], ssc: StreamingContext, streamProvider: StreamProvider, configurationManager: ConfigurationManager): Option[DStream[FortisAnalysis]] = {
    @transient val configs = configurationManager.fetchStreamConfiguration(name)
    @transient val sourceStream = streamProvider.buildStream[T](ssc, configs)

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

      def convertToSchema(original: T): AnalyzerOutput[T] = {
        val message = analyzer.toSchema(original, locationsExtractor, imageAnalyzer)
        AnalyzerOutput(message, Analysis())
      }

      def addLanguage(item: AnalyzerOutput[T]): AnalyzerOutput[T] = {
        val language = analyzer.detectLanguage(item.fortisMessage, languageDetector)
        item.copy(analysis = Analysis(language = language))
      }

      def isLanguageSupported(analysis: Analysis): Boolean = {
        analysis.language match {
          case None => false
          case Some(language) => supportedLanguages.contains(language)
        }
      }

      def addKeywords(item: AnalyzerOutput[T]): AnalyzerOutput[T] = {
        val keywords = analyzer.extractKeywords(item.fortisMessage, keywordExtractor)
        item.copy(analysis = item.analysis.copy(keywords = keywords))
      }

      def hasKeywords(analysis: Analysis): Boolean = {
        analysis.keywords.nonEmpty
      }

      def addEntities(item: AnalyzerOutput[T]): AnalyzerOutput[T] = {
        val entities = analyzer.extractEntities(item.fortisMessage, peopleRecognizer)
        item.copy(analysis = item.analysis.copy(entities = entities))
      }

      def addSentiments(item: AnalyzerOutput[T]): AnalyzerOutput[T] = {
        val sentiments = analyzer.detectSentiment(item.fortisMessage, sentimentDetector)
        item.copy(analysis = item.analysis.copy(sentiments = sentiments))
      }

      def addLocations(item: AnalyzerOutput[T]): AnalyzerOutput[T] = {
        val locations = analyzer.extractLocations(item.fortisMessage, locationsExtractor)
        item.copy(analysis = item.analysis.copy(locations = locations))
      }

      // Configure analysis pipeline
      rdd
        .map(convertToSchema)
        .map(addLanguage)
        .filter(item => isLanguageSupported(item.analysis))
        .map(addKeywords)
        .filter(item => hasKeywords(item.analysis))
        .map(item => addLocations(addSentiments(addEntities(item))))
    }))
  }
}