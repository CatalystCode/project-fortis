package com.microsoft.partnercatalyst.fortis.spark

import java.time.{Duration, Instant}
import java.util.concurrent._

import com.microsoft.azure.servicebus._
import com.microsoft.azure.servicebus.primitives.ConnectionStringBuilder
import com.microsoft.partnercatalyst.fortis.spark.logging.FortisTelemetry.{get => Log}
import org.apache.spark.streaming.StreamingContext

import scala.reflect.io.Path
import scala.util.control.NonFatal

object StreamsChangeListener {

  var queueClient: Option[QueueClient] = None
  var messageHandler: Option[CommandMessageHandler] = None
  var suggestedExitCode = 0

  def apply(ssc: StreamingContext, settings: FortisSettings): Unit = {
    this.ensureMessageHandlerIsInitialized(ssc, settings)
    this.ensureQueueClientIsInitialized(ssc, settings)
  }

  private[spark] def ensureMessageHandlerIsInitialized(ssc: StreamingContext, settings: FortisSettings): Unit = {
    this.messageHandler match {
      case Some(handler) =>
        handler.currentContext = Some(ssc)
      case None =>
        val handler = new CommandMessageHandler(settings)
        handler.currentContext = Some(ssc)
        messageHandler = Some(handler)
    }
  }

  private[spark] def ensureQueueClientIsInitialized(ssc: StreamingContext, settings: FortisSettings): Unit = {
    this.queueClient match {
      case Some(_) =>
        // Do nothing.
      case None =>
        val client = new QueueClient(
          new ConnectionStringBuilder(settings.managementBusConnectionString, settings.managementBusCommandQueueName),
          ReceiveMode.PeekLock
        )
        client.registerMessageHandler(
          this.messageHandler.get,
          new MessageHandlerOptions(
            1 /*maxConcurrentCalls*/,
            true /*autoComplete*/,
            Duration.ofMinutes(5) /*maxAutoRenewDuration*/
          )
        )
        queueClient = Some(client)
    }
  }

  private[spark] class CommandMessageHandler(settings: FortisSettings) extends IMessageHandler {

    private val initializedAt = Instant.now()
    private val scheduler = Executors.newScheduledThreadPool(2)
    private var scheduledTask : Option[ScheduledFuture[_]] = None
    var currentContext: Option[StreamingContext] = None

    override def notifyException(exception: Throwable, phase: ExceptionPhase): Unit = {
      Log.logError("Service Bus client threw error while processing message.", exception)
    }

    override def onMessageAsync(message: IMessage): CompletableFuture[Void] = {
      val messageId = message.getMessageId

      Log.logEvent("streamsChangeListener.messageHandler", Map("messageId" -> messageId, "step" -> "received"))

      if (message.getEnqueuedTimeUtc.isBefore(this.initializedAt)) {
        Log.logEvent("streamsChangeListener.messageHandler", Map("messageId" -> messageId, "step" -> "ignored-predates-initialization"))
        return CompletableFuture.completedFuture(null)
      }

      this.scheduledTask match {
        case Some(task) =>
          Log.logEvent("streamsChangeListener.messageHandler", Map("messageId" -> messageId, "step" -> "rescheduling-task"))
          task.cancel(false)
        case None =>
          Log.logEvent("streamsChangeListener.messageHandler", Map("messageId" -> messageId, "step" -> "scheduling-task"))
      }

      this.currentContext match {
        case Some(context) =>
          this.scheduledTask = Some(this.scheduler.schedule(
            new ContextStopRunnable(settings, context, scheduler, messageId),
            settings.sscShutdownDelayMillis,
            TimeUnit.MILLISECONDS
          ))
        case None =>
          Log.logInfo(s"No streaming context set; Nothing to stop.")
      }

      CompletableFuture.completedFuture(null)
    }
  }

  private[spark] class ContextStopRunnable(settings: FortisSettings, ssc: StreamingContext, scheduler: ScheduledExecutorService, messageId: String) extends Runnable {
    override def run(): Unit = {
      Log.logEvent("streamsChangeListener.contextStopRunnable", Map("messageId" -> messageId, "step" -> "stop-initialized"))

      StreamsChangeListener.suggestedExitCode = 10
      val timeoutTask = scheduler.schedule(new TimeoutRunnable(), 30L, TimeUnit.SECONDS)
      try {
        ssc.stop(stopSparkContext = true, stopGracefully = false)
        timeoutTask.cancel(false)

        Log.logEvent("streamsChangeListener.contextStopRunnable", Map("messageId" -> messageId, "step" -> "stop-completed"))

        if (!settings.progressDir.isEmpty) {
          Path(settings.progressDir).deleteRecursively()
        }
      } catch {
        case NonFatal(e) => Log.logError("Error stopping streaming context", e)
      }
    }
  }

  private[spark] class TimeoutRunnable extends Runnable {
    override def run(): Unit = {
      System.exit(StreamsChangeListener.suggestedExitCode)
    }
  }

}
