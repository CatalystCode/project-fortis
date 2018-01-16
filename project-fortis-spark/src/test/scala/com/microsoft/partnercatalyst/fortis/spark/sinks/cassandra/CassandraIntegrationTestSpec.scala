package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra._
import org.scalatest.FlatSpec

class CassandraIntegrationTestSpec extends FlatSpec {
  it should "verify that we can produce conjunctive topic tuples from a list of topics" in {
    val conjunctiveTopics = Utils.getConjunctiveTopics(Option(Seq("sam", "erik", "tom"))).sorted
    val expectedTopics = Seq(
      ("erik","",""),
      ("erik","sam",""),
      ("erik","sam","tom"),
      ("erik","tom",""),
      ("sam","",""),
      ("sam","tom",""),
      ("tom","","")
    )
    assert(conjunctiveTopics.length === 7)
    assert(conjunctiveTopics === expectedTopics)
  }
}
