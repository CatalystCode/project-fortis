package com.microsoft.partnercatalyst.fortis.spark

// TODO: remove this once transform context settings can be read from Cassandra
import com.microsoft.partnercatalyst.fortis.spark.ProjectFortis.Settings
import com.microsoft.partnercatalyst.fortis.spark.analyzer.{Analyzer, ExtendedFortisEvent}
import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, FortisEvent}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.StreamProvider
import com.microsoft.partnercatalyst.fortis.spark.transformcontext.TransformContextProvider
import com.microsoft.partnercatalyst.fortis.spark.transforms.ZipModelsProvider
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.PlaceRecognizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.people.PeopleRecognizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.topic.{Blacklist, KeywordExtractor}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

import scala.reflect.runtime.universe.TypeTag

object Pipeline {
  def apply[T: TypeTag](
    name: String,
    analyzer: Analyzer[T],
    ssc: StreamingContext,
    streamProvider: StreamProvider,
    transformContextProvider: TransformContextProvider,
    configurationManager: ConfigurationManager
  ): Option[DStream[FortisEvent]] = {
    val configs = configurationManager.fetchConnectorConfigs(name)
    val sourceStream = streamProvider.buildStream[T](ssc, configs)

    val entityModelsProvider = new ZipModelsProvider(language => s"${Settings.blobUrlBase}/opener/opener-$language.zip", Settings.modelsDir)
    val sentimentModelsProvider = new ZipModelsProvider(language => s"${Settings.blobUrlBase}/sentiment/sentiment-$language.zip", Settings.modelsDir)

    sourceStream.map(_.transform(rdd => {
      // Note: this block executes on the driver, whereas the operations applied to 'rdd' (i.e. rdd.map(_))
      // will execute on workers.

      // Get the shared transform context, updating it only if needed.
      val transformContext = transformContextProvider.getOrUpdateContext(rdd.sparkContext)

      // Copy TransformContext fields locally to avoid serializing everything to each task. In this way, each task's
      // serialization will only include the fields that it accesses (Spark's closure cleaner will remove the others)
      val geofence = transformContext.siteSettings.geofence
      val supportedLanguages = transformContext.siteSettings.languages

      val imageAnalyzer = transformContext.imageAnalyzer
      val languageDetector = transformContext.languageDetector
      val sentimentDetectorAuth = transformContext.sentimentDetectorAuth

      // Broadcast variables
      val langToKeywordExtractor = transformContext.langToKeywordExtractor
      val blacklist = transformContext.blacklist
      val locationsExtractorFactory = transformContext.locationsExtractorFactory

      def convertToSchema(original: T): ExtendedFortisEvent[T] = {
        val message = analyzer.toSchema(original, locationsExtractorFactory.value.fetch _, imageAnalyzer)
        ExtendedFortisEvent(message, Analysis())
      }

      def addLanguage(event: ExtendedFortisEvent[T]): ExtendedFortisEvent[T] = {
        val language = analyzer.detectLanguage(event.details, languageDetector)
        event.copy(analysis = Analysis(language = language))
      }

      def isLanguageSupported(analysis: Analysis): Boolean = {
        analysis.language match {
          case None => false
          case Some(language) => supportedLanguages.contains(language)
        }
      }

      def addKeywords(event: ExtendedFortisEvent[T]): ExtendedFortisEvent[T] = {
        event.analysis.language match {
          case Some(lang) =>
            langToKeywordExtractor.value.get(lang) match {
              case Some(extractor) => event.copy(
                analysis = event.analysis.copy(keywords = analyzer.extractKeywords(event.details, extractor))
              )
              case None => event
            }
          case None => event
        }
      }

      def hasKeywords(analysis: Analysis): Boolean = {
        analysis.keywords.nonEmpty
      }

      def isEmpty(x: String) = x == null || x.isEmpty

      def requiredValuesProvided(event: ExtendedFortisEvent[T]): Boolean = {
        !isEmpty(event.details.id) && !isEmpty(event.details.externalsourceid) && !isEmpty(event.details.pipelinekey)
      }

      def hasBlacklistedTerms(event: ExtendedFortisEvent[T]): Boolean = {
        analyzer.hasBlacklistedTerms(event.details, new Blacklist(blacklist.value))
      }

      def addEntities(event: ExtendedFortisEvent[T]): ExtendedFortisEvent[T] = {
        val entities = analyzer.extractEntities(event.details, new PeopleRecognizer(entityModelsProvider, event.analysis.language))
        event.copy(analysis = event.analysis.copy(entities = entities))
      }

      def addSentiments(event: ExtendedFortisEvent[T]): ExtendedFortisEvent[T] = {
        val sentiments = analyzer.detectSentiment(event.details,
          new SentimentDetector(sentimentModelsProvider, event.analysis.language, sentimentDetectorAuth))
        event.copy(analysis = event.analysis.copy(sentiments = sentiments))
      }

      def addLocations(event: ExtendedFortisEvent[T]): ExtendedFortisEvent[T] = {
        val locations = analyzer.extractLocations(event.details,
          locationsExtractorFactory.value.create(Some(new PlaceRecognizer(entityModelsProvider, event.analysis.language))))
        event.copy(analysis = event.analysis.copy(locations = locations))
      }

      // Configure analysis pipeline
      rdd
        .map(convertToSchema)
        .filter(requiredValuesProvided)
        .filter(item => !hasBlacklistedTerms(item))
        .map(addLanguage)
        .filter(item => isLanguageSupported(item.analysis))
        .map(addKeywords)
        .filter(item => hasKeywords(item.analysis))
        .map(item => addLocations(addSentiments(addEntities(item))))
    }))
  }
}