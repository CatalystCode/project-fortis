package com.microsoft.partnercatalyst.fortis.spark

// TODO: remove this once transform context settings can be read from Cassandra
import com.microsoft.partnercatalyst.fortis.spark.ProjectFortis.Settings

import scala.reflect.runtime.universe.TypeTag
import com.microsoft.partnercatalyst.fortis.spark.analyzer.{Analyzer, ExtendedEvent}
import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, FortisEvent}
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.StreamProvider
import com.microsoft.partnercatalyst.fortis.spark.transforms.ZipModelsProvider
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.{ImageAnalysisAuth, ImageAnalyzer}
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.{LanguageDetector, LanguageDetectorAuth}
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.{Geofence, LocationsExtractor, LocationsExtractorFactory, PlaceRecognizer}
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.people.PeopleRecognizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.{SentimentDetector, SentimentDetectorAuth}
import com.microsoft.partnercatalyst.fortis.spark.transforms.topic.KeywordExtractor
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

object Pipeline {
  def apply[T: TypeTag](name: String, analyzer: Analyzer[T], ssc: StreamingContext, streamProvider: StreamProvider, configurationManager: ConfigurationManager): Option[DStream[FortisEvent]] = {
    val configs = configurationManager.fetchStreamConfiguration(name)
    val sourceStream = streamProvider.buildStream[T](ssc, configs)

    sourceStream.map(_.transform(rdd => {

      // TODO: replace with global update/broadcast wrappers which will update and (where applicable) broadcast
      val geofence = Geofence(north = 49.6185146245, west = -124.9578052195, south = 46.8691952854, east = -121.0945042053)
      val modelsProvider = new ZipModelsProvider(
        language => s"https://fortiscentral.blob.core.windows.net/opener/opener-$language.zip",
        Settings.modelsDir)

      val featureServiceClient = new FeatureServiceClient(Settings.featureServiceHost)
      val locationsExtractorFactory = new LocationsExtractorFactory(featureServiceClient, geofence).buildLookup()
      val locationFetcher = locationsExtractorFactory.fetch _
      val keywordExtractor = new KeywordExtractor(List("Ariana"))
      val imageAnalyzer = new ImageAnalyzer(ImageAnalysisAuth(Settings.oxfordVisionToken), featureServiceClient)
      val languageDetector = new LanguageDetector(LanguageDetectorAuth(Settings.oxfordLanguageToken))
      val sentimentDetectorAuth = SentimentDetectorAuth(Settings.oxfordLanguageToken)
      val supportedLanguages = Set("en", "fr", "de")

      def convertToSchema(original: T): ExtendedEvent[T] = {
        val message = analyzer.toSchema(original, locationFetcher, imageAnalyzer)
        ExtendedEvent(message, Analysis())
      }

      def addLanguage(event: ExtendedEvent[T]): ExtendedEvent[T] = {
        val language = analyzer.detectLanguage(event.details, languageDetector)
        event.copy(analysis = Analysis(language = language))
      }

      def isLanguageSupported(analysis: Analysis): Boolean = {
        analysis.language match {
          case None => false
          case Some(language) => supportedLanguages.contains(language)
        }
      }

      def addKeywords(event: ExtendedEvent[T]): ExtendedEvent[T] = {
        val keywords = analyzer.extractKeywords(event.details, keywordExtractor)
        event.copy(analysis = event.analysis.copy(keywords = keywords))
      }

      def hasKeywords(analysis: Analysis): Boolean = {
        analysis.keywords.nonEmpty
      }

      def addEntities(event: ExtendedEvent[T]): ExtendedEvent[T] = {
        val entities = analyzer.extractEntities(event.details, new PeopleRecognizer(modelsProvider, event.analysis.language))
        event.copy(analysis = event.analysis.copy(entities = entities))
      }

      def addSentiments(event: ExtendedEvent[T]): ExtendedEvent[T] = {
        val sentiments = analyzer.detectSentiment(event.details,
          new SentimentDetector(modelsProvider, event.analysis.language, sentimentDetectorAuth))
        event.copy(analysis = event.analysis.copy(sentiments = sentiments))
      }

      def addLocations(event: ExtendedEvent[T]): ExtendedEvent[T] = {
        val locations = analyzer.extractLocations(event.details,
          locationsExtractorFactory.create(Some(new PlaceRecognizer(modelsProvider, event.analysis.language))))
        event.copy(analysis = event.analysis.copy(locations = locations))
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