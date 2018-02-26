package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import java.util.{Date, UUID}

import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto._
import org.scalatest.FlatSpec

class CassandraConjunctiveTopicsTestSpec extends FlatSpec {
  it should "flat map keywords" in {
    val event = Event(
      pipelinekey = "Twitter",
      computedfeatures_json = Features.asJson(Features(
        mentions = 1,
        sentiment = Sentiment(1.0),
        keywords = Seq("europe", "humanitarian"),
        places = Seq(Place("abc123", 10.0, 20.0)),
        entities = Seq()
      )),
      eventtime = Period("day-2017-08-11").startTime(),
      eventlangcode = "en",
      eventid = UUID.randomUUID().toString,
      sourceeventid = UUID.randomUUID().toString,
      insertiontime = new Date().getTime,
      body = "",
      imageurl = None,
      summary = "",
      batchid = UUID.randomUUID().toString,
      externalsourceid = "HamillHimself",
      sourceurl = "",
      title = ""
    )

    val topics = CassandraConjunctiveTopics.flatMapKeywords(event)

    assert(topics == Seq(
      ("europe", ""),
      ("humanitarian", ""),
      ("europe", "humanitarian"),
      ("humanitarian", "europe")
    ))
  }
}
