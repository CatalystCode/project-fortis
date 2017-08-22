package com.microsoft.partnercatalyst.fortis.spark

import java.time.Duration
import java.util.concurrent.CompletableFuture
import java.util.{Timer, TimerTask}

import com.microsoft.azure.servicebus._
import com.microsoft.azure.servicebus.primitives.ConnectionStringBuilder
import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import org.apache.spark.streaming.StreamingContext

object StreamsChangeListener {

  @volatile @transient private var queueClient: QueueClient = _

  def apply(ssc: StreamingContext, settings: FortisSettings): Unit = {
    queueClient = new QueueClient(
      new ConnectionStringBuilder(settings.managementBusConnectionString, settings.managementBusCommandQueueName),
      ReceiveMode.PeekLock
    )
    queueClient.registerMessageHandler(
      new CommandMessageHandler(ssc, settings),
      new MessageHandlerOptions(
        1, // Max concurrent calls
        true,
        Duration.ofMinutes(5)
      )
    )
  }

  private class CommandMessageHandler(ssc: StreamingContext, settings: FortisSettings) extends IMessageHandler with Loggable {

    var timer: Option[Timer] = None

    override def notifyException(exception: Throwable, phase: ExceptionPhase): Unit = {
      logError("Service Bus client threw error while processing message.", exception)
    }

    override def onMessageAsync(message: IMessage): CompletableFuture[Void] = {
      if (message.getLabel != "streamsDidChange") {
        return CompletableFuture.completedFuture(null)
      }

      val contextStopWaitTimeMillis = settings.contextStopWaitTimeMillis

      if (this.timer.isDefined) {
        logInfo(s"Service Bus message for updated streams received; Re-scheduling streaming context stop for ${contextStopWaitTimeMillis} milliseconds from now.")
        this.timer.get.cancel()
      } else {
        logInfo(s"Service Bus message for updated streams received; Requesting streaming context stop in ${contextStopWaitTimeMillis} milliseconds.")
      }

      val t = new Timer()
      t.schedule(new TimerTask {
        override def run(): Unit = {
          logInfo(s"Requesting streaming context stop now.")
          ssc.stop(stopSparkContext = true, stopGracefully = true)
        }
      }, contextStopWaitTimeMillis)
      this.timer = Some(t)

      CompletableFuture.completedFuture(null)
    }
  }

}
