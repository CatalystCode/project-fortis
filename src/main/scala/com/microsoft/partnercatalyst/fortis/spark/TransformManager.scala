package com.microsoft.partnercatalyst.fortis.spark

import java.time.Duration
import java.util.concurrent.{CompletableFuture, SynchronousQueue, TimeUnit}

import com.microsoft.azure.servicebus.primitives.ConnectionStringBuilder
import com.microsoft.azure.servicebus._
import com.microsoft.partnercatalyst.fortis.spark.TransformManager.TransformContext
import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.dto.SiteSettings
import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.{ImageAnalysisAuth, ImageAnalyzer}
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.{LanguageDetector, LanguageDetectorAuth}
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractorFactory
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetectorAuth
import com.microsoft.partnercatalyst.fortis.spark.transforms.topic.{Blacklist, KeywordExtractor}
import org.apache.spark.SparkContext
import org.apache.spark.broadcast.Broadcast

import scala.util.{Failure, Properties, Success, Try}


class TransformManager extends Serializable with Loggable {
  private val UpdateSettings = 1
  private val UpdateWhitelist = 2
  private val UpdateBlacklist = 4

  // These will be serialized with their initialization values, since Spark should only serialize this class once when
  // building the DStream graph that's saved to the checkpoint.
  // Thus, when recovering from a checkpoint, they will be initialized to these values as well.
  @volatile private var shouldUpdate: SynchronousQueue[Int] = new SynchronousQueue[Int]()
  @volatile private var transformContext: TransformContext = null
  @volatile private var siteSettings: SiteSettings = null

  @volatile private var queueClient: QueueClient = null

  def getOrUpdateContext(sparkContext: SparkContext, configManager: ConfigurationManager, featureServiceClient: FeatureServiceClient): TransformContext = {

    if (transformContext == null) {
      // Blocking init of transform context and queue client used for non-blocking updates.
      // Initialization has not yet occurred since construction/deserialization.
      synchronized {
        if (transformContext == null) {
          // Initialization
          queueClient = new QueueClient(
            new ConnectionStringBuilder(Properties.envOrElse("FORTIS_SERVICEBUS_CONN_STR", "")), ReceiveMode.PeekLock)

          queueClient.registerMessageHandler(
            new MessageHandler(configManager),
            new MessageHandlerOptions(
              1, // Max concurrent calls
              true,
              Duration.ofMinutes(5)))

          // Fetch all data synchronously for init
          siteSettings = configManager.fetchSiteSettings()
          // TODO: fetch whitelist and blacklist

          // Update transformContext and broadcast as needed
          transformContext = TransformContext()
          publishSettings(sparkContext, featureServiceClient)
          publishWhitelist(sparkContext, featureServiceClient)
          publishBlacklist(sparkContext, featureServiceClient)

          return transformContext
        }
      }
    }

    synchronized {
      val dirtyFlags: Option[Int] = Option(shouldUpdate.poll(0, TimeUnit.SECONDS))

      // The updates to siteSettings, whitelist, blacklist etc. happens-before the corresponding poll returns, so their
      // values used by publish functions will be as new or newer than they were when set by the client lib thread
      // that enqueued 'flags' (but aren't necessarily from the same iteration). In other words, it's possible publish
      // functions will publish data that's newer than it was at the time the producer thread notified us through the
      // sync queue. This is intended.
      dirtyFlags.foreach(flags => {
        if ((flags & UpdateSettings) != 0) {
          publishSettings(sparkContext, featureServiceClient)
        }

        if ((flags & UpdateWhitelist) != 0) {
          publishWhitelist(sparkContext, featureServiceClient)
        }

        if ((flags & UpdateBlacklist) != 0) {
          publishBlacklist(sparkContext, featureServiceClient)
        }
      })
    }

    transformContext
  }

  private class MessageHandler(configurationManager: ConfigurationManager) extends IMessageHandler {
    override def notifyException(exception: Throwable, phase: ExceptionPhase): Unit = {
      logError("Service Bus client threw error while processing message.", exception)
    }

    override def onMessageAsync(message: IMessage): CompletableFuture[Void] = {
      val flags = Option(message.getProperties.getOrDefault("dirty", null)) match {
        case Some(value) => Try(value.toInt) match {
          case Success(parsed) => parsed
          case Failure(ex) =>
            logError(s"Could not parse 'dirty' property to an integer.", ex)
            0
        }
        case None =>
          logError(s"Service Bus client received unexpected message: ${message.toString}")
          0
      }

      if ((flags & UpdateSettings) != 0) {
        siteSettings = configurationManager.fetchSiteSettings()
      }

      if ((flags & UpdateWhitelist) != 0) {
        // TODO: fetch whitelist from cassandra
      }

      if ((flags & UpdateBlacklist) != 0) {
        // TODO: fetch blacklist from cassandra
      }

      // Block for up to two minutes for a Spark thread to acknowledge the updated
      // state. If we time out, assume that this TransformManager instance has been
      // replaced (Spark context restart / checkpoint discard), and shut down to
      // allow our successor to handle the message instead.
      if (!shouldUpdate.offer(flags, 2, TimeUnit.MINUTES)) {
        logDebug("Shutting down Service Bus client: timeout exceeded.")

        // Shut down client
        queueClient.closeAsync()

        throw new Exception("No Spark thread acknowledged the update message within the timeout.")
      }

      CompletableFuture.completedFuture(null)
    }
  }

  private def publishSettings(sparkContext: SparkContext, featureServiceClient: FeatureServiceClient): Unit = {
    transformContext = transformContext.copy(
      locationsExtractorFactory = new LocationsExtractorFactory(featureServiceClient, siteSettings.geofence).buildLookup(),
      imageAnalyzer = new ImageAnalyzer(ImageAnalysisAuth(siteSettings.cogVisionSvcToken), featureServiceClient),
      languageDetector = new LanguageDetector(LanguageDetectorAuth(siteSettings.translationSvcToken)),
      sentimentDetectorAuth = SentimentDetectorAuth(siteSettings.translationSvcToken),
      supportedLanguages = siteSettings.languages
    )
  }

  private def publishWhitelist(sparkContext: SparkContext, featureServiceClient: FeatureServiceClient): Unit = {
    transformContext = transformContext.copy(
      keywordExtractor = sparkContext.broadcast(new KeywordExtractor(List("Ariana")))
    )
  }

  private def publishBlacklist(sparkContext: SparkContext, featureServiceClient: FeatureServiceClient): Unit = {
    transformContext = transformContext.copy(
      blacklist = sparkContext.broadcast(new Blacklist(Seq(Set("Trump", "Hilary"))))
    )
  }
}

object TransformManager {
  case class TransformContext private(
    locationsExtractorFactory: LocationsExtractorFactory = null,
    blacklist: Broadcast[Blacklist] = null,
    keywordExtractor: Broadcast[KeywordExtractor] = null,
    imageAnalyzer: ImageAnalyzer = null,
    languageDetector: LanguageDetector = null,
    sentimentDetectorAuth: SentimentDetectorAuth = null,
    supportedLanguages: Set[String] = null
  )
}