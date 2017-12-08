package com.microsoft.partnercatalyst.fortis.spark

import java.time.{Duration, Instant}
import java.util.concurrent._

import com.microsoft.azure.servicebus._
import com.microsoft.azure.servicebus.primitives.ConnectionStringBuilder
import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import org.apache.spark.streaming.StreamingContext

import scala.reflect.io.Path

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
      case Some(handler) => {
        handler.currentContext = Some(ssc)
      }
      case None => {
        val handler = new CommandMessageHandler(settings)
        handler.currentContext = Some(ssc)
        messageHandler = Some(handler)
      }
    }
  }

  private[spark] def ensureQueueClientIsInitialized(ssc: StreamingContext, settings: FortisSettings) = {
    this.queueClient match {
      case Some(client) => {
        // Do nothing.
      }
      case None => {
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
  }

  private[spark] class CommandMessageHandler(settings: FortisSettings) extends IMessageHandler with Loggable {

    private val initializedAt = Instant.now()
    private val scheduler = Executors.newScheduledThreadPool(2)
    private var scheduledTask : Option[ScheduledFuture[_]] = None
    var currentContext: Option[StreamingContext] = None

    override def notifyException(exception: Throwable, phase: ExceptionPhase): Unit = {
      logError("Service Bus client threw error while processing message.", exception)
    }

    override def onMessageAsync(message: IMessage): CompletableFuture[Void] = {
      System.err.println(s"Service Bus message received ${message}.")

      if (message.getEnqueuedTimeUtc.isBefore(this.initializedAt)) {
        System.err.println(s"Service Bus message ignored since it predates listener initialization.")
        return CompletableFuture.completedFuture(null)
      }

      this.scheduledTask match {
        case Some(task) => {
          System.err.println(s"Service Bus message for updated streams received; Re-scheduling streaming context stop for ${settings.sscShutdownDelayMillis} milliseconds from now.")
          task.cancel(false)
        }
        case None => {
          System.err.println(s"Service Bus message for updated streams received; Requesting streaming context stop in ${settings.sscShutdownDelayMillis} milliseconds.")
        }
      }

      this.currentContext match {
        case Some(context) => {
          this.scheduledTask = Some(this.scheduler.schedule(
            new ContextStopRunnable(settings, context, scheduler),
            settings.sscShutdownDelayMillis,
            TimeUnit.MILLISECONDS
          ))
        }
        case None => {
          System.err.println(s"No streaming context set; Nothing to stop.")
        }
      }

      CompletableFuture.completedFuture(null)
    }
  }

  private[spark] class ContextStopRunnable(settings: FortisSettings, ssc: StreamingContext, scheduler: ScheduledExecutorService) extends Runnable with Loggable {
    override def run(): Unit = {
      StreamsChangeListener.suggestedExitCode = 10
      System.err.println(s"Requesting streaming context stop now.")
      val timeoutTask = scheduler.schedule(new TimeoutRunnable(), 30L, TimeUnit.SECONDS)
      try {
        ssc.stop(stopSparkContext = true, stopGracefully = false)
        timeoutTask.cancel(false)
        System.err.println(s"Streaming context stop complete; Cleaning up...")
        if (!settings.progressDir.isEmpty) {
          Path(settings.progressDir).deleteRecursively()
        }
      } catch {
        case e: Throwable => e.printStackTrace(System.err)
      }
    }
  }

  private[spark] class TimeoutRunnable extends Runnable {
    override def run(): Unit = {
      System.exit(StreamsChangeListener.suggestedExitCode)
    }
  }

}
