package com.microsoft.partnercatalyst.fortis.spark

import com.microsoft.azure.servicebus.{IMessage, QueueClient}
import org.apache.spark.streaming.StreamingContext
import org.mockito.{ArgumentMatchers, Mockito}
import org.scalatest.{BeforeAndAfter, FlatSpec}

class StreamsChangeListenerSpec extends FlatSpec with BeforeAndAfter {

  val queueClient: QueueClient = Mockito.mock(classOf[QueueClient])
  val settings = FortisSettings(
    "/tmp/progress",
    "https://featurehost",
    "https://blobhost",
    "cassandraHosts",
    7,
    "managementBusConnectionString",
    "managementBusConfigQueueName",
    "managementBusCommandQueueName",
    None,
    7,
    None
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
    val ssc: StreamingContext = Mockito.mock(classOf[StreamingContext])
    StreamsChangeListener(ssc, settings)
    Mockito.verifyNoMoreInteractions(ssc)
    val message: IMessage = Mockito.mock(classOf[IMessage])
    Mockito.when(message.getLabel).thenReturn("streamsDidChange")
    StreamsChangeListener.messageHandler.get.onMessageAsync(message)
    Thread.sleep(10)
    Mockito.verify(ssc).stop(ArgumentMatchers.eq(true), ArgumentMatchers.eq(true))
    Thread.sleep(10)
    Mockito.verifyNoMoreInteractions(ssc)
  }

  it should "ignore irrelevant messages" in {
    val ssc: StreamingContext = Mockito.mock(classOf[StreamingContext])
    StreamsChangeListener(ssc, settings)
    Mockito.verifyNoMoreInteractions(ssc)
    val message: IMessage = Mockito.mock(classOf[IMessage])
    Mockito.when(message.getLabel).thenReturn("someIrrelevantMessage")
    StreamsChangeListener.messageHandler.get.onMessageAsync(message)
    Thread.sleep(14)
    Mockito.verifyNoMoreInteractions(ssc)
  }
}
