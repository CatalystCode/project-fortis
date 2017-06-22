package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import java.time.Instant

import com.microsoft.partnercatalyst.fortis.spark.SparkTestSpec
import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, AnalyzedItem}
import org.apache.spark.SparkConf
import org.apache.spark.rdd.RDD
import org.apache.spark.streaming.Seconds
import com.datastax.spark.connector._

import scala.collection.mutable

class CassandraSinkSpec extends SparkTestSpec {
  protected val appName = "test-cassandra"

  "The cassandra sink" should "connect to cassandra without exception" in {
    checkIfShouldRun()

    val rdds = mutable.Queue[RDD[AnalyzedItem]]()
    rdds += sc.makeRDD(Seq(
      AnalyzedItem(
        createdAtEpoch = Instant.now.getEpochSecond,
        body = "body-1",
        title = "title-1",
        publisher = "publisher-1",
        sourceUrl = "sourceUrl-1",
        analysis = Analysis())))
    rdds += sc.makeRDD(Seq(
      AnalyzedItem(
        createdAtEpoch = Instant.now.getEpochSecond,
        body = "body-2",
        title = "title-2",
        publisher = "publisher-2",
        sourceUrl = "sourceUrl-2",
        analysis = Analysis()),
      AnalyzedItem(
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

  private def checkIfShouldRun(): Unit = {
    if (conf.get("spark.cassandra.connection.host").isEmpty) {
      cancel("No cassandra connection defined, skipping test")
    }
  }

  protected override def setupSparkConf(conf: SparkConf): SparkConf = {
    CassandraConfig.init(conf, batchDuration)
  }
}
