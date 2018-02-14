package com.microsoft.partnercatalyst.fortis.spark.transformcontext

import java.time.Duration
import java.util.concurrent.locks.ReentrantLock
import java.util.concurrent.{CompletableFuture, SynchronousQueue, TimeUnit}

import com.microsoft.azure.servicebus._
import com.microsoft.azure.servicebus.primitives.ConnectionStringBuilder
import com.microsoft.partnercatalyst.fortis.spark.FortisSettings
import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.logging.FortisTelemetry.{get => Log}
import org.apache.spark.SparkContext

@SerialVersionUID(100L)
class TransformContextProvider(configManager: ConfigurationManager, featureServiceClientUrlBase: String)
  (implicit settings: FortisSettings) extends Serializable
{
  private val deltaChannel: SynchronousQueue[Delta] = new SynchronousQueue[Delta]()
  private val writeLock: ReentrantLock = new ReentrantLock(true)

  // Do not serialize these values. The transformContext would otherwise contain stale Broadcast
  // instances, so we rebuild it on recovery from checkpoint.
  @volatile @transient private var transformContext: TransformContext = _
  @volatile @transient private var queueClient: QueueClient = _

  def getOrUpdateContext(sparkContext: SparkContext): TransformContext = {
    ensureInitialized(sparkContext)

    writeLock.lock()
    try {
      // Grab the next delta from the service bus client thread if one is ready.
      // If not, either no update requests have arrived on the service bus queue, or the service bus client thread is
      // still fulfilling a request (and hence the Delta is not yet available). Return the current context.
      val delta = Option(deltaChannel.poll(0, TimeUnit.SECONDS))

      if (delta.isDefined) {
        updateTransformContextAndBroadcast(delta.get, sparkContext)
      }
    } finally {
      writeLock.unlock()
    }

    transformContext
  }

  private def ensureInitialized(sparkContext: SparkContext): Unit = {
    if (transformContext == null) {
      // Blocking init of transform context and queue client used for non-blocking updates.
      // Initialization has not yet occurred since construction/deserialization.
      writeLock.lock()
      try {
        if (transformContext == null) {

          // Fetch data synchronously
          val siteSettings = configManager.fetchSiteSettings(sparkContext)
          val langToWatchlist = configManager.fetchWatchlist(sparkContext)
          val blacklist = configManager.fetchBlacklist(sparkContext)

          val delta = Delta(TransformContext(), featureServiceClientUrlBase, Some(siteSettings), Some(langToWatchlist), Some(blacklist))

          updateTransformContextAndBroadcast(delta, sparkContext)
          startQueueClient(sparkContext)
        }
      } finally {
        writeLock.unlock()
      }
    }
  }

  private def startQueueClient(sparkContext: SparkContext): Unit = {
    queueClient = new QueueClient(
      new ConnectionStringBuilder(settings.managementBusConnectionString, settings.managementBusConfigQueueName),
      ReceiveMode.PeekLock)

    queueClient.registerMessageHandler(
      new MessageHandler(sparkContext),
      new MessageHandlerOptions(
        1, // Max concurrent calls
        true,
        Duration.ofMinutes(5)))
  }

  /**
    * Creates a new transform context from the current one, overwriting any corresponding fields that are
    * non-empty in the provided delta. Broadcast fields are broadcasted here as well, as needed.
    *
    * Note: this is only called by Spark threads.
    */
  private def updateTransformContextAndBroadcast(delta: Delta, sparkContext: SparkContext): Unit = {
    if (transformContext == null) {
      transformContext = TransformContext()
    }

    transformContext = transformContext.copy(
      siteSettings = delta.siteSettings.getOrElse(transformContext.siteSettings),
      langToKeywordExtractor = delta.langToKeywordExtractor match {
        case Some(list) => sparkContext.broadcast(list)
        case None => transformContext.langToKeywordExtractor
      },
      blacklist = delta.blacklist match {
        case Some(list) => sparkContext.broadcast(list)
        case None => transformContext.blacklist
      },
      locationsExtractorFactory = delta.locationsExtractorFactory match {
        case Some(factory) => sparkContext.broadcast(factory)
        case None => transformContext.locationsExtractorFactory
      },
      imageAnalyzer = delta.imageAnalyzer.getOrElse(transformContext.imageAnalyzer),
      sentimentDetectorAuth = delta.sentimentDetectorAuth.getOrElse(transformContext.sentimentDetectorAuth)
    )
  }

  private class MessageHandler(sparkContext: SparkContext) extends IMessageHandler {
    override def notifyException(exception: Throwable, phase: ExceptionPhase): Unit = {
      Log.logError("Service Bus client threw error while processing message.", exception)
      Log.logDependency("pipeline.settings", "transformcontext.messageHandler", success = false, durationInMs = 0)
    }

    /**
      * Called by the QueueClient thread when a message arrives on the Service Bus.
      *
      * Note: this is configured in [[TransformContextProvider.startQueueClient]] such that it's called serially (only 1 thread
      *       will execute it at a time) which is necessary for the concurrency correctness of this module.
      */
    override def onMessageAsync(message: IMessage): CompletableFuture[Void] = {
      // Wait for the previous update of transform context to settle
      // to ensure we're calculating the delta against the latest context
      writeLock.lock()
      writeLock.unlock()

      // Read the service bus message and build delta using data store.
      val delta = Option(message.getProperties) match {
        case Some(properties) => Option(properties.getOrDefault("dirty", null)) match {
          case Some(value) => value match {
            case "settings" =>
              val siteSettings = configManager.fetchSiteSettings(sparkContext)
              Log.logDependency("pipeline.settings", "transformcontext.messageHandler", success = true, durationInMs = 0)
              Delta(transformContext, featureServiceClientUrlBase, siteSettings = Some(siteSettings))
            case "watchlist" =>
              val langToWatchlist = configManager.fetchWatchlist(sparkContext)
              Log.logDependency("pipeline.settings", "transformcontext.messageHandler", success = true, durationInMs = 0)
              Delta(transformContext, featureServiceClientUrlBase, langToWatchlist = Some(langToWatchlist))
            case "blacklist" =>
              val blacklist = configManager.fetchBlacklist(sparkContext)
              Log.logDependency("pipeline.settings", "transformcontext.messageHandler", success = true, durationInMs = 0)
              Delta(transformContext, featureServiceClientUrlBase, blacklist = Some(blacklist))

            case unknown =>
              Log.logError(s"Service Bus client received unexpected update request. Ignoring.: $unknown")
              Log.logDependency("pipeline.settings", "transformcontext.messageHandler", success = false, durationInMs = 0)
              Delta()
            }
          case None =>
            Log.logError(s"Service Bus client received unexpected message. Ignoring.: ${message.toString}")
            Log.logDependency("pipeline.settings", "transformcontext.messageHandler", success = false, durationInMs = 0)
            Delta()
        }
        case None => Delta
          Log.logError(s"Service Bus client received unexpected message. Ignoring.: ${message.toString}")
          Log.logDependency("pipeline.settings", "transformcontext.messageHandler", success = false, durationInMs = 0)
          Delta()
      }

      // Block for up to two minutes for a Spark thread to acknowledge the updated
      // state. If we time out, assume that this TransformContextProvider instance has been
      // replaced (Spark context restarted & checkpoint was discarded), and shut down to
      // allow our successor to handle the message instead.
      if (!deltaChannel.offer(delta, 2, TimeUnit.MINUTES)) {
        Log.logDebug("Shutting down Service Bus client: timeout exceeded.")

        // Shut down client
        queueClient.closeAsync()

        throw new Exception("No Spark thread acknowledged the update message within the timeout.")
      }

      CompletableFuture.completedFuture(null)
    }
  }
}