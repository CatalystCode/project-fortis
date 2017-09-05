package com.microsoft.partnercatalyst.fortis.spark.sink.cassandra

import java.util.{Date, UUID}

import com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries.Period
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.CassandraConjunctiveTopics
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto._
import org.scalatest.FlatSpec

class CassandraConjunctiveTopicsTestSpec extends FlatSpec {

  it should "produce an non-empty sequence" in {
    val period = Period("day-2017-08-11")
    val topics = CassandraConjunctiveTopics(Event(
      pipelinekey = "twitter",
      computedfeatures = Features(
        mentions = 1,
        sentiment = Sentiment(1.0),
        keywords = Seq("europe", "humanitarian"),
        places = Seq(Place("abc123", 10.0, 20.0)),
        entities = Seq()
      ),
      eventtime = period.startTime(),
      eventlangcode = "en",
      eventid = UUID.randomUUID().toString,
      sourceeventid = UUID.randomUUID().toString,
      insertiontime = new Date().getTime,
      body = "",
      summary = "",
      fulltext = "",
      batchid = UUID.randomUUID().toString,
      externalsourceid = "HamillHimself",
      topics = Seq(),
      placeids = Seq(),
      sourceurl = "",
      title = ""
    ))
    assert(topics.size == 180)
    assert(topics.head == ConjunctiveTopic(
      conjunctivetopic = "",
      externalsourceid = "HamillHimself",
      mentioncount = 1,
      perioddate =  period.startTime(),
      periodtype = "day",
      pipelinekey = "twitter",
      tileid = "8_120_142",
      tilez = 8,
      topic = "europe"
    ))
  }

  it should "produce a non-empty sequence on single keyword" in {
    val period = Period("day-2017-08-11")
    val topics = CassandraConjunctiveTopics(Event(
      pipelinekey = "twitter",
      computedfeatures = Features(
        mentions = 1,
        sentiment = Sentiment(1.0),
        keywords = Seq("europe"),
        places = Seq(Place("abc123", 10.0, 20.0)),
        entities = Seq()
      ),
      eventtime = period.startTime(),
      eventlangcode = "en",
      eventid = UUID.randomUUID().toString,
      sourceeventid = UUID.randomUUID().toString,
      insertiontime = new Date().getTime,
      body = "",
      summary = "",
      fulltext = "",
      batchid = UUID.randomUUID().toString,
      externalsourceid = "HamillHimself",
      topics = Seq(),
      placeids = Seq(),
      sourceurl = "",
      title = ""
    ))
    assert(topics.size == 45)
    assert(topics.head == ConjunctiveTopic(
      conjunctivetopic = "",
      externalsourceid = "HamillHimself",
      mentioncount = 1,
      perioddate =  period.startTime(),
      periodtype = "day",
      pipelinekey = "twitter",
      tileid = "8_120_142",
      tilez = 8,
      topic = "europe"
    ))
  }

  it should "produce an empty sequence on empty places" in {
    val topics = CassandraConjunctiveTopics(Event(
      pipelinekey = "twitter",
      computedfeatures = Features(
        mentions = 1,
        sentiment = Sentiment(1.0),
        keywords = Seq("europe", "humanitarian"),
        places = Seq(),
        entities = Seq()
      ),
      eventtime = new Date().getTime,
      eventlangcode = "en",
      eventid = UUID.randomUUID().toString,
      sourceeventid = UUID.randomUUID().toString,
      insertiontime = new Date().getTime,
      body = "",
      summary = "",
      fulltext = "",
      batchid = UUID.randomUUID().toString,
      externalsourceid = "HamillHimself",
      topics = Seq(),
      placeids = Seq(),
      sourceurl = "",
      title = ""
    ))
    assert(topics == Seq())
  }

  it should "produce an empty sequence on empty keywords" in {
    val topics = CassandraConjunctiveTopics(Event(
      pipelinekey = "twitter",
      computedfeatures = Features(
        mentions = 1,
        sentiment = Sentiment(1.0),
        keywords = Seq(),
        places = Seq(Place("abc123", 10.0, 20.0)),
        entities = Seq()
      ),
      eventtime = new Date().getTime,
      eventlangcode = "en",
      eventid = UUID.randomUUID().toString,
      sourceeventid = UUID.randomUUID().toString,
      insertiontime = new Date().getTime,
      body = "",
      summary = "",
      fulltext = "",
      batchid = UUID.randomUUID().toString,
      externalsourceid = "HamillHimself",
      topics = Seq(),
      placeids = Seq(),
      sourceurl = "",
      title = ""
    ))
    assert(topics == Seq())
  }
}
