package com.microsoft.partnercatalyst.fortis.spark

import java.time.Instant
import java.util.UUID
import java.util.UUID.randomUUID

import com.datastax.spark.connector._
import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, AnalyzedItem}
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.{CassandraConfig, CassandraSink}
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamFactory, StreamProvider, UnsupportedConnectorConfigException}
import org.apache.spark.rdd.RDD
import org.apache.spark.streaming.dstream.DStream
import org.apache.spark.streaming.{Seconds, StreamingContext}
import org.apache.spark.{SparkConf, SparkContext}
import org.scalatest.{BeforeAndAfter, FlatSpec}

import scala.collection.mutable

class SparkSpec extends FlatSpec with BeforeAndAfter {
  private val master = "local[2]"
  private val appName = "test-stream-provider"
  private val batchDuration = Seconds(1)

  private var conf: SparkConf = _
  private var sc: SparkContext = _
  private var ssc: StreamingContext = _

  object TestStreamFactory {
    val Name = "Test"
    val paramIndex = "index"
  }

  class TestStreamFactory(inputQueues: List[mutable.Queue[RDD[String]]]) extends StreamFactory[String] {
    override def createStream(streamingContext: StreamingContext): PartialFunction[ConnectorConfig, DStream[String]] = {
      case ConnectorConfig(TestStreamFactory.Name, params) =>
        streamingContext.queueStream[String](inputQueues(params(TestStreamFactory.paramIndex).toInt))
    }
  }

  object TestProviderWithTestFactory {
    def apply(inputQueues: List[mutable.Queue[RDD[String]]] = List(mutable.Queue[RDD[String]]())): StreamProvider = {
      StreamProvider().withFactories(List(new TestStreamFactory(inputQueues)))
    }
  }

  before {
    conf = new SparkConf()
      .setMaster(master)
      .setAppName(appName)
    CassandraConfig.init(conf, batchDuration)

    ssc = new StreamingContext(conf, batchDuration)
    sc = ssc.sparkContext
  }

  after {
    if (ssc != null) {
      ssc.stop()
    }
  }

  "The stream provider" should "return None when a stream is built from an empty set of configs" in {
    val provider = TestProviderWithTestFactory()

    assertResult(None) {
      provider.buildStream[String](ssc, List())
    }
  }

  it should "return a stream containing data from all configured streams" in {
    val provider = TestProviderWithTestFactory(List(
      mutable.Queue(sc.makeRDD(Seq("A"))), // Data source 0 contains element "A"
      mutable.Queue(sc.makeRDD(Seq("B")))  // Data source 1 contains element "B"
    ))

    val testStream = provider.buildStream[String](ssc, List(
      // Specify 2 configs, one that reads from data source 0, and one that reads from data source 1
      ConnectorConfig(TestStreamFactory.Name, Map(TestStreamFactory.paramIndex -> "0")),
      ConnectorConfig(TestStreamFactory.Name, Map(TestStreamFactory.paramIndex -> "1"))
    ))

    testStream match {
      case Some(stream) =>
        val capture = mutable.ArrayBuffer[String]()

        // TODO: does this really work on non-local deployments?
        stream.foreachRDD(capture ++= _.collect())

        // Start an then Stop gracefully so we can ensure we've collected all test items
        ssc.start()
        ssc.stop(stopSparkContext = false, stopGracefully = true)

        assert(capture.exists(_.contains("A")))
        assert(capture.exists(_.contains("B")))
      case None => fail("no stream")
    }
  }

  it should "throw when a stream config is not supported" in {
    val provider = TestProviderWithTestFactory()

    intercept[UnsupportedConnectorConfigException] {
      provider.buildStream[String](ssc, List(
        ConnectorConfig("InvalidName", Map())
      ))
    }
  }

  it should "trip an assert when a stream config can be handled by > 1 factories registered for its element type" in {
    val provider = StreamProvider().withFactories(
      List(
        // Double-register the test factory
        new TestStreamFactory(List(mutable.Queue[RDD[String]]())),
        new TestStreamFactory(List(mutable.Queue[RDD[String]]()))
      )
    )

    intercept[AssertionError] {
      provider.buildStream[String](ssc, List(
        ConnectorConfig(TestStreamFactory.Name, Map())
      ))
    }
  }

  "The cassandra sink" should "write to cassandra" in {
    if (conf.get("spark.cassandra.connection.host").isEmpty) {
      cancel("No cassandra connection defined, skipping test")
    }

    val rdds = mutable.Queue[RDD[AnalyzedItem]]()
    rdds += sc.makeRDD(Seq(
      AnalyzedItem(
        id = randomUUID(),
        createdAtEpoch = Instant.now.getEpochSecond,
        body = "body-1",
        title = "title-1",
        publisher = "publisher-1",
        sourceUrl = "sourceUrl-1",
        analysis = Analysis())))
    rdds += sc.makeRDD(Seq(
      AnalyzedItem(
        id = randomUUID(),
        createdAtEpoch = Instant.now.getEpochSecond,
        body = "body-2",
        title = "title-2",
        publisher = "publisher-2",
        sourceUrl = "sourceUrl-2",
        analysis = Analysis()),
      AnalyzedItem(
        id = randomUUID(),
        createdAtEpoch = Instant.now.getEpochSecond,
        body = "body-3",
        title = "title-3",
        publisher = "publisher-3",
        sourceUrl = "sourceUrl-3",
        analysis = Analysis())))
    val stream = Some(ssc.queueStream(rdds))

    val keyspaceName = "fortistest"
    val tableName = "events"
    sc.cassandraTable(keyspaceName, tableName).deleteFromCassandra(keyspaceName, tableName)

    CassandraSink(stream, keyspaceName, tableName)
    ssc.start()
    ssc.awaitTerminationOrTimeout(Seconds(5).milliseconds)

    val numRows = sc.cassandraTable(keyspaceName, tableName).count()
    assert(numRows == 3)
  }
}