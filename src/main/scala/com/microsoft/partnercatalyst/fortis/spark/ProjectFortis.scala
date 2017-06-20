package com.microsoft.partnercatalyst.fortis.spark

import com.microsoft.partnercatalyst.fortis.spark.logging.AppInsights
import com.microsoft.partnercatalyst.fortis.spark.pipeline._
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.ConnectorConfig
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.{ImageAnalysisAuth, ImageAnalyzer}
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.{LanguageDetector, LanguageDetectorAuth}
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.{Geofence, LocationsExtractor, PlaceRecognizer}
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.{SentimentDetector, SentimentDetectorAuth}
import com.microsoft.partnercatalyst.fortis.spark.transforms.topic.KeywordExtractor
import org.apache.log4j.{Level, LogManager, Logger}
import org.apache.spark.{SparkConf, SparkContext}
import org.apache.spark.streaming.{Seconds, StreamingContext}
import sun.reflect.generics.reflectiveObjects.NotImplementedException

object ProjectFortis extends App {

  private val pipelines = List[Pipeline](
    InstagramPipeline,
    RadioPipeline,
    TwitterPipeline,
    FacebookPipeline,
    TadawebPipeline
  )

  // TODO: create helper method to augment Settings object with data from Cassandra
  // TODO: move most of these settings to Cassandra
  private implicit object Settings extends Settings {
    import scala.util.Properties.envOrNone

    val progressDir = envOrFail(Constants.Env.HighlyAvailableProgressDir)
    val featureServiceHost = envOrFail(Constants.Env.FeatureServiceHost)
    val oxfordLanguageToken = envOrFail(Constants.Env.OxfordLanguageToken)
    val oxfordVisionToken = envOrFail(Constants.Env.OxfordVisionToken)

    val appInsightsKey = envOrNone(Constants.Env.AppInsightsKey)
    val modelsDir = envOrNone(Constants.Env.LanguageModelDir)

    private def envOrFail(name: String): String = {
      envOrNone(name) match {
        case Some(v) => v
        case None =>
          sys.error(s"Environment variable not defined: $name")
      }
    }
  }

  // TODO: logging configuration should be done in log4j config file
  AppInsights.init(Settings.appInsightsKey)

  Logger.getLogger("org").setLevel(Level.ERROR)
  Logger.getLogger("akka").setLevel(Level.ERROR)
  Logger.getLogger("libinstagram").setLevel(Level.DEBUG)
  Logger.getLogger("libfacebook").setLevel(Level.DEBUG)
  Logger.getLogger("liblocations").setLevel(Level.DEBUG)

  private object TransformContext extends TransformContext {
    val geofence = Geofence(north = 49.6185146245, west = -124.9578052195, south = 46.8691952854, east = -121.0945042053)
    val placeRecognizer = new PlaceRecognizer(Settings.modelsDir)
    val featureServiceClient = new FeatureServiceClient(Settings.featureServiceHost)
    val locationsExtractor = new LocationsExtractor(featureServiceClient, geofence, Some(placeRecognizer)).buildLookup()
    val keywordExtractor = new KeywordExtractor(List("Ariana"))
    val imageAnalyzer = new ImageAnalyzer(ImageAnalysisAuth(Settings.oxfordVisionToken), featureServiceClient)
    val languageDetector = new LanguageDetector(LanguageDetectorAuth(Settings.oxfordLanguageToken))
    val sentimentDetector = new SentimentDetector(SentimentDetectorAuth(Settings.oxfordLanguageToken))
    val supportedLanguages = Set("en", "fr", "de")
  }

  private def createStreamingContext(): StreamingContext = {
    val conf = new SparkConf()
      .setAppName(Constants.SparkAppName)
      .setIfMissing("spark.master", Constants.SparkMasterDefault)

    val ssc = new StreamingContext(
      new SparkContext(conf),
      Seconds(Constants.SparkStreamingBatchSizeDefault))

    val streamProvider = StreamProviderFactory.create()
    val streamRegistry = getStreamRegistry

    // Attach each pipeline (aka code path)
    // 'fortisEvents' is the stream of analyzed data aggregated (union) from all pipelines
    val fortisEvents = pipelines.flatMap(
      pipeline => pipeline(streamProvider, streamRegistry, ssc, TransformContext)
    ).reduceOption(_.union(_))

    // TODO: other computations and save to DB
    fortisEvents.foreach(_.print())

    ssc
  }

  // Main starts here
  val ssc = StreamingContext.getOrCreate(Settings.progressDir, createStreamingContext)

  ssc.start()
  ssc.awaitTermination()

  /**
    * TODO: Use Cassandra to populate
    * Build connector config registry from hard-coded values for demo.
    *
    * The key is the name of the pipeline and the value is a list of connector configs whose streams should comprise it.
    */
  private def getStreamRegistry: Map[String, List[ConnectorConfig]] = {
    Map[String, List[ConnectorConfig]](
      "instagram" -> List(
        ConnectorConfig(
          "InstagramTag",
          Map(
            "authToken" -> System.getenv("INSTAGRAM_AUTH_TOKEN"),
            "tag" -> "rose"
          )
        ),
        ConnectorConfig(
          "InstagramLocation",
          Map(
            "authToken" -> System.getenv("INSTAGRAM_AUTH_TOKEN"),
            "latitude" -> "49.25",
            "longitude" -> "-123.1"
          )
        )
      ),
      "radio" -> List(
        ConnectorConfig(
          "Radio",
          Map(
            "subscriptionKey" -> System.getenv("OXFORD_SPEECH_TOKEN"),
            "radioUrl" -> "http://live02.rfi.fr/rfimonde-32.mp3", // "http://bbcmedia.ic.llnwd.net/stream/bbcmedia_radio3_mf_p",
            "audioType" -> ".mp3",
            "locale" -> "fr-FR", //"en-US",
            "speechType" -> "CONVERSATION",
            "outputFormat" -> "SIMPLE"
          )
        )
      ),
      "twitter" -> List(
        ConnectorConfig(
          "Twitter",
          Map(
            "consumerKey" -> System.getenv("TWITTER_CONSUMER_KEY"),
            "consumerSecret" -> System.getenv("TWITTER_CONSUMER_SECRET"),
            "accessToken" -> System.getenv("TWITTER_ACCESS_TOKEN"),
            "accessTokenSecret" -> System.getenv("TWITTER_ACCESS_TOKEN_SECRET")
          )
        )
      ),
      "facebook" -> List(
        ConnectorConfig(
          "FacebookPage",
          Map(
            "accessToken" -> System.getenv("FACEBOOK_AUTH_TOKEN"),
            "appId" -> System.getenv("FACEBOOK_APP_ID"),
            "appSecret" -> System.getenv("FACEBOOK_APP_SECRET"),
            "pageId" -> "aljazeera"
          )
        )
      ),
      "tadaweb" -> List(
        ConnectorConfig(
          "Tadaweb",
          Map (
            "policyName" -> System.getenv("TADAWEB_EH_POLICY_NAME"),
            "policyKey" -> System.getenv("TADAWEB_EH_POLICY_KEY"),
            "namespace" -> System.getenv("TADAWEB_EH_NAMESPACE"),
            "name" -> System.getenv("TADAWEB_EH_NAME"),
            "partitionCount" -> System.getenv("TADAWEB_EH_PARTITION_COUNT"),
            "consumerGroup" -> "$Default"
          )
        )
      )
    )
  }
}