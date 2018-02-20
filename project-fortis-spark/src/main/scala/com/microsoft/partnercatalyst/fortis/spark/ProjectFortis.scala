package com.microsoft.partnercatalyst.fortis.spark

import com.microsoft.partnercatalyst.fortis.spark.analyzer._
import com.microsoft.partnercatalyst.fortis.spark.dba.CassandraConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.logging.FortisTelemetry.{get => Log}
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.{CassandraConfig, CassandraEventsSink}
import com.microsoft.partnercatalyst.fortis.spark.sources.StreamProviderFactory
import com.microsoft.partnercatalyst.fortis.spark.transformcontext.TransformContextProvider
import org.apache.log4j.{Level, Logger}
import org.apache.spark.sql.SparkSession
import org.apache.spark.streaming.{Seconds, StreamingContext}
import org.apache.spark.{SparkConf, SparkContext}

import scala.reflect.runtime.universe.TypeTag
import scala.util.Properties.{envOrElse, envOrNone}

object ProjectFortis extends App {
  private implicit val fortisSettings: FortisSettings = {
    def envOrFail(name: String): String = {
      envOrNone(name) match {
        case Some(v) => v
        case None =>
          sys.error(s"Environment variable not defined: $name")
      }
    }

    FortisSettings(
      // Required
      featureServiceUrlBase = envOrFail(Constants.Env.FeatureServiceUrlBase),
      cognitiveUrlBase = s"https://${envOrFail(Constants.Env.Location).replace(" ", "").toLowerCase}.api.cognitive.microsoft.com",
      cassandraHosts = envOrFail(Constants.Env.CassandraHost),
      cassandraPorts = envOrFail(Constants.Env.CassandraPort),
      cassandraUsername = envOrFail(Constants.Env.CassandraUsername),
      cassandraPassword = envOrFail(Constants.Env.CassandraPassword),
      managementBusConnectionString = envOrFail(Constants.Env.ManagementBusConnectionString),
      managementBusConfigQueueName = envOrFail(Constants.Env.ManagementBusConfigQueueName),
      managementBusCommandQueueName = envOrFail(Constants.Env.ManagementBusCommandQueueName),

      // Optional
      progressDir = envOrElse(Constants.Env.HighlyAvailableProgressDir, ""),
      blobUrlBase = envOrElse(Constants.Env.BlobUrlBase, "https://fortiscentral.blob.core.windows.net"),
      appInsightsKey = envOrNone(Constants.Env.AppInsightsKey),
      sscInitRetryAfterMillis = envOrElse(Constants.Env.SscInitRetryAfterMillis, Constants.SscInitRetryAfterMillis.toString).toLong,
      sscShutdownDelayMillis = envOrElse(Constants.Env.SscShutdownDelayMillis, Constants.SscShutdownDelayMillis.toString).toLong,
      maxKeywordsPerEvent = envOrElse(Constants.Env.MaxKeywordsPerEvent, Constants.maxKeywordsPerEventDefault.toString).toInt,
      maxLocationsPerEvent = envOrElse(Constants.Env.MaxLocationsPerEvent, Constants.maxLocationsPerEventDefault.toString).toInt
    )
  }

  Logger.getLogger("org").setLevel(Level.ERROR)
  Logger.getLogger("akka").setLevel(Level.ERROR)
  Logger.getLogger("libinstagram").setLevel(Level.DEBUG)
  Logger.getLogger("libfacebook").setLevel(Level.DEBUG)
  Logger.getLogger("liblocations").setLevel(Level.DEBUG)

  private def createStreamingContext(): StreamingContext = {
    val batchDuration = Seconds(envOrElse(Constants.Env.SparkStreamingBatchSize, Constants.SparkStreamingBatchSizeDefault.toString).toLong)
    val conf = new SparkConf()
      .setAppName(Constants.SparkAppName)
      .setIfMissing("spark.master", Constants.SparkMasterDefault)
      .set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
      .set("spark.kryo.registrator", "com.microsoft.partnercatalyst.fortis.spark.serialization.KryoRegistrator")
      .set("spark.kryoserializer.buffer", "128k")
      .set("spark.kryoserializer.buffer.max", "64m")
      .set("spark.network.timeout", "800")
      .set("spark.sql.broadcastTimeout", "1200")
      .set("spark.rpc.askTimeout", "30")
    CassandraConfig.init(conf, batchDuration, fortisSettings)

    val sparkContext = new SparkContext(conf)
    val ssc = new StreamingContext(sparkContext, batchDuration)
    if (!fortisSettings.progressDir.isEmpty) {
      ssc.checkpoint(fortisSettings.progressDir)
    }
    ssc
  }

  private def attachToContext(ssc:StreamingContext): Boolean = {
    val configManager = new CassandraConfigurationManager
    val streamProvider = StreamProviderFactory.create(configManager)
    val transformContextProvider = new TransformContextProvider(configManager, fortisSettings.featureServiceUrlBase, fortisSettings.cognitiveUrlBase)

    def pipeline[T: TypeTag](name: String, analyzer: Analyzer[T]) =
      Pipeline(name, analyzer, ssc, streamProvider, transformContextProvider, configManager)

    val siteSettings = configManager.fetchSiteSettings(ssc.sparkContext)
    // Attach each pipeline (aka code path)
    // 'fortisEvents' is the stream of analyzed data aggregated (union) from all pipelines
    val fortisEvents = List(
      pipeline("Twitter", new TwitterAnalyzer),
      pipeline("Facebook", new FacebookPostAnalyzer),
      pipeline("Facebook", new FacebookCommentAnalyzer),
      pipeline("Instagram", new InstagramAnalyzer),
      pipeline("Tadaweb", new TadawebAnalyzer),
      pipeline("Customevents", new CustomEventAnalyzer),
      pipeline("Bing", new BingAnalyzer),
      pipeline("Radio", new RadioAnalyzer),
      pipeline("Reddit", new RedditAnalyzer),
      pipeline("HTML", new HTMLAnalyzer),
      pipeline("RSS", new RSSAnalyzer(siteSettings.defaultlanguage.get))
    ).flatten.reduceOption(_.union(_))

    if (fortisEvents.isEmpty) return false

    val session = SparkSession.builder().config(ssc.sparkContext.getConf).getOrCreate()
    CassandraEventsSink(fortisEvents.get, session, configManager)

    true
  }

  // Main starts here
  Log.logInfo("Creating streaming context.")
  val ssc = createStreamingContext()

  while (!attachToContext(ssc)) {
    Log.logInfo(s"No actions attached to streaming context; retrying in ${fortisSettings.sscInitRetryAfterMillis} milliseconds.")
    Thread.sleep(fortisSettings.sscInitRetryAfterMillis)
  }
  Log.logInfo("Starting streaming context.")
  StreamsChangeListener(ssc, fortisSettings)
  ssc.start()
  ssc.awaitTermination()
  Log.logInfo(s"Streaming context stopped. Exiting with exit code ${StreamsChangeListener.suggestedExitCode}...")
  sys.exit(StreamsChangeListener.suggestedExitCode)
}
