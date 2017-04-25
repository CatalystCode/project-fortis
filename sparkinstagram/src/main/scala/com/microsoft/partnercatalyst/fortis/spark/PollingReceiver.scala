package com.microsoft.partnercatalyst.fortis.spark

import java.util.concurrent.{ScheduledThreadPoolExecutor, TimeUnit}

import org.apache.spark.storage.StorageLevel
import org.apache.spark.streaming.receiver.Receiver

case class Schedule(interval: Long, unit: TimeUnit, initialDelay: Long = 1)

abstract class PollingReceiver[T](
  schedule: Schedule,
  storageLevel: StorageLevel,
  numWorkers: Int
) extends Receiver[T](storageLevel) {

  private var threadPool: ScheduledThreadPoolExecutor = _

  def onStart(): Unit = {
    threadPool = new ScheduledThreadPoolExecutor(numWorkers)

    val pollingThread = new Thread("Polling thread") {
      override def run(): Unit = {
        poll()
      }
    }

    threadPool.scheduleAtFixedRate(pollingThread, schedule.initialDelay, schedule.interval, schedule.unit)
  }

  def onStop(): Unit = {
    if (threadPool != null) {
      threadPool.shutdown()
    }
  }

  protected def poll()
}
