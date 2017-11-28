package com.microsoft.partnercatalyst.fortis.spark

import java.time.Instant
import java.util.UUID

import com.microsoft.azure.servicebus.{IMessage, QueueClient}
import org.apache.spark.SparkContext
import org.apache.spark.streaming.StreamingContext
import org.mockito.{ArgumentMatchers, Mockito}
import org.scalatest.{BeforeAndAfter, FlatSpec}

class StreamsChangeListenerTestSpec extends FlatSpec with BeforeAndAfter {

  val queueClient: QueueClient = Mockito.mock(classOf[QueueClient])

  val settings = FortisSettings(
    "/tmp/test_fortis_progress_dir_" + UUID.randomUUID(),
    "https://featurehost",
    "https://blobhost",
    "cassandraHosts",
    "managementBusConnectionString",
    "managementBusConfigQueueName",
    "managementBusCommandQueueName",
    None,
    7,
    7,
    None,
    maxKeywordsPerEvent = 5,
    maxLocationsPerEvent = 3
  )

  before {
    StreamsChangeListener.messageHandler = None
    StreamsChangeListener.queueClient = Some(queueClient)
  }

  after {
    StreamsChangeListener.messageHandler = None
    StreamsChangeListener.queueClient = None
  }

  it should "create a message handler on apply" in {
    assert(StreamsChangeListener.messageHandler.isEmpty)
    val ssc: StreamingContext = Mockito.mock(classOf[StreamingContext])
    StreamsChangeListener(ssc, settings)
    assert(StreamsChangeListener.messageHandler.isDefined)
  }

  it should "call stop on context after delay" in {
    val sparkContext = Mockito.mock(classOf[SparkContext])
    val ssc: StreamingContext = Mockito.mock(classOf[StreamingContext])
    Mockito.when(ssc.sparkContext).thenReturn(sparkContext)
    StreamsChangeListener(ssc, settings)
    Mockito.verifyNoMoreInteractions(ssc)
    val message: IMessage = Mockito.mock(classOf[IMessage])
    Mockito.when(message.getLabel).thenReturn("streamsDidChange")
    Mockito.when(message.getEnqueuedTimeUtc).thenReturn(Instant.now())
    StreamsChangeListener.messageHandler.get.onMessageAsync(message)
    Thread.sleep(10)
    Mockito.verify(ssc).stop(ArgumentMatchers.eq(true), ArgumentMatchers.eq(false))
    Thread.sleep(10)
    Mockito.verifyNoMoreInteractions(ssc)
  }

  it should "ignore messages that predate initialization" in {
    val sparkContext = Mockito.mock(classOf[SparkContext])
    val ssc: StreamingContext = Mockito.mock(classOf[StreamingContext])
    Mockito.when(ssc.sparkContext).thenReturn(sparkContext)
    StreamsChangeListener(ssc, settings)
    Mockito.verifyNoMoreInteractions(ssc)
    val message: IMessage = Mockito.mock(classOf[IMessage])
    Mockito.when(message.getLabel).thenReturn("streamsDidChange")
    Mockito.when(message.getEnqueuedTimeUtc).thenReturn(Instant.ofEpochSecond(0))
    StreamsChangeListener.messageHandler.get.onMessageAsync(message)
    Thread.sleep(20)
    Mockito.verifyNoMoreInteractions(ssc)
  }
}
