package com.microsoft.partnercatalyst.fortis.spark.sink.cassandra

import java.sql.Timestamp
import java.util.Date

import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra._
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto._
import org.joda.time.DateTime
import org.scalatest.FlatSpec

class CassandraIntegrationTestSpec extends FlatSpec {
  it should "verify that we can produce conjunctive topic tuples from a list of topics" in {
    val conjunctiveTopics = Utils.getConjunctiveTopics(Option(Seq("sam", "erik", "tom")))
    val expectedHeadItem = ("erik", "sam", "tom")
    assert(conjunctiveTopics.length === 7)
    assert(conjunctiveTopics(0) === expectedHeadItem)
  }
}
