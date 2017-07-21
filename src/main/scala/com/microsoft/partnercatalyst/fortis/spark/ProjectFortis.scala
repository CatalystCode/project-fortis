package com.microsoft.partnercatalyst.fortis.spark

import com.microsoft.partnercatalyst.fortis.spark.analyzer._
import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.dto.{BlacklistedTerm, Geofence, SiteSettings}
import com.microsoft.partnercatalyst.fortis.spark.logging.AppInsights
import com.microsoft.partnercatalyst.fortis.spark.sources.StreamProviderFactory
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.ConnectorConfig
import com.microsoft.partnercatalyst.fortis.spark.transformcontext.TransformContextProvider
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import org.apache.log4j.{Level, Logger}
import org.apache.spark.streaming.{Seconds, StreamingContext}
import org.apache.spark.{SparkConf, SparkContext}

import scala.reflect.runtime.universe.TypeTag
import scala.util.Properties.envOrElse

object ProjectFortis extends App {

  // TODO: create helper method to augment Settings object with data from Cassandra
  // TODO: move most of these settings to Cassandra
  implicit object Settings extends Settings {
    import scala.util.Properties.envOrNone

    val progressDir = envOrFail(Constants.Env.HighlyAvailableProgressDir)
    val featureServiceUrlBase = envOrFail(Constants.Env.FeatureServiceUrlBase)
    val oxfordLanguageToken = envOrFail(Constants.Env.OxfordLanguageToken)
    val oxfordVisionToken = envOrFail(Constants.Env.OxfordVisionToken)
    val kafkaHost = envOrFail(Constants.Env.KafkaHost)
    val kafkaTopic = envOrElse(Constants.Env.KafkaTopic, "fortisevents")
    val blobUrlBase = envOrElse(Constants.Env.BlobUrlBase, "https://fortiscentral.blob.core.windows.net")

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

  private def createStreamingContext(): StreamingContext = {
    val conf = new SparkConf()
      .setAppName(Constants.SparkAppName)
      .setIfMissing("spark.master", Constants.SparkMasterDefault)
      .set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
      .set("spark.kryo.registrator", "com.microsoft.partnercatalyst.fortis.spark.serialization.KryoRegistrator")
      .set("spark.kryoserializer.buffer", "128k")
      .set("spark.kryoserializer.buffer.max", "64m")

    val ssc = new StreamingContext(
      new SparkContext(conf),
      Seconds(Constants.SparkStreamingBatchSizeDefault))

    val streamProvider = StreamProviderFactory.create()

    val configManager = DummyConfigurationManager
    val featureServiceClient = new FeatureServiceClient(Settings.featureServiceUrlBase)
    val transformContextProvider = new TransformContextProvider(configManager, featureServiceClient)

    def pipeline[T: TypeTag](name: String, analyzer: Analyzer[T]) =
      Pipeline(name, analyzer, ssc, streamProvider, transformContextProvider, configManager)

    // Attach each pipeline (aka code path)
    // 'fortisEvents' is the stream of analyzed data aggregated (union) from all pipelines
    val fortisEvents = List(
      pipeline("twitter", new TwitterAnalyzer),
      pipeline("facebook", new FacebookPostAnalyzer),
      pipeline("instagram", new InstagramAnalyzer),
      pipeline("tadaweb", new TadawebAnalyzer),
      pipeline("customevents", new CustomEventAnalyzer),
      pipeline("bing", new BingAnalyzer),
      pipeline("radio", new RadioAnalyzer),
      pipeline("reddit", new RedditAnalyzer)
    ).flatten.reduceOption(_.union(_))
    //KafkaSink(fortisEvents, Settings.kafkaHost, Settings.kafkaTopic)

    ssc.checkpoint(Settings.progressDir)
    ssc
  }

  // Main starts here
  val ssc = StreamingContext.getOrCreate(Settings.progressDir, createStreamingContext)

  ssc.start()
  ssc.awaitTermination()

  /**
    * TODO: Replace with cassandra configuration manager implementation
    * Build connector config registry from hard-coded values for demo.
    *
    */
  @SerialVersionUID(100L)
  private object DummyConfigurationManager extends ConfigurationManager with Serializable {
    override def fetchConnectorConfigs(pipeline: String): List[ConnectorConfig] = {
      // The key is the name of the pipeline and the value is a list of connector configs whose streams should comprise it.
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
        "bing" -> List(
          ConnectorConfig(
            "BingPage",
            Map(
              "accessToken" -> System.getenv("BING_ACCESS_TOKEN"),
              "searchInstanceId" -> System.getenv("BING_SEARCH_INSTANCE_ID"),
              "keywords" -> "isis|attack"
            )
          )
        ),
        "reddit" -> List(
          ConnectorConfig(
            "RedditObject",
            Map(
              "applicationId" -> System.getenv("REDDIT_APPLICATION_ID"),
              "applicationSecret" -> System.getenv("REDDIT_APPLICATION_SECRET"),
              "keywords" -> "isis|attack"
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
              "keywords" -> "isis|attack",
              "userIds" -> "4970411|5536782", // al jazeera english and arabic
              "languages" -> "en|ar",
              "locations" -> "-122.75,36.8,-121.75,37.8|-74,40,-73,41", // san francisco and new york
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
              "pageIds" -> "aljazeera|cnn|bloomberg"
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
        ),
        "customevents" -> List(
          ConnectorConfig(
            "CustomEvents",
            Map (
              "policyName" -> envOrElse("CUSTOMEVENTS_EH_POLICY_NAME", "project-fortis-spark"),
              "policyKey" -> System.getenv("CUSTOMEVENTS_EH_POLICY_KEY"),
              "namespace" -> envOrElse("CUSTOMEVENTS_EH_NAMESPACE", "fortiscustomevents"),
              "name" -> envOrElse("CUSTOMEVENTS_EH_NAME", "customevents"),
              "partitionCount" -> envOrElse("CUSTOMEVENTS_EH_PARTITION_COUNT", "1"),
              "consumerGroup" -> envOrElse("CUSTOMEVENTS_EH_CONSUMER_GROUP", "$Default")
            )
          )
        )
      )(pipeline)
    }

    override def fetchSiteSettings(): SiteSettings = SiteSettings(
      id = null,
      siteName = "",
      geofence = Geofence(north = 49.6185146245, west = -124.9578052195, south = 46.8691952854, east = -121.0945042053),
      languages = Set("en", "fr", "de"),
      defaultZoom = 0,
      title = "",
      logo = "",
      translationSvcToken = Settings.oxfordLanguageToken,
      cogSpeechSvcToken = System.getenv("OXFORD_SPEECH_TOKEN"),
      cogTextSvcToken = Settings.oxfordLanguageToken,
      cogVisionSvcToken = Settings.oxfordVisionToken,
      insertionTime = ""
    )

    override def fetchTrustedSources(connector: String): List[String] = ???

    override def fetchWatchlist(): Map[String, List[String]] =
      Map(
        "en" -> List("Ariana")
      )

    override def fetchBlacklist(): List[BlacklistedTerm] =
      List(
        BlacklistedTerm(conjunctiveFilter = Set("Trump", "Hilary"))
      )
  }
}