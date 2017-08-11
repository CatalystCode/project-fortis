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
      insertiontime = new Date().getTime,
      body = "",
      fulltext = "",
      batchid = UUID.randomUUID().toString,
      externalsourceid = "HamillHimself",
      topics = Seq(),
      placeids = Seq(),
      sourceurl = "",
      title = ""
    ))
    assert(topics.size == 90)
    assert(topics.head == ConjunctiveTopicAggregate(
      conjunctivetopic = "humanitarian",
      externalsourceid = "HamillHimself",
      mentioncount = 1,
      period = period.toString,
      periodenddate =  period.endTime(),
      periodstartdate =  period.startTime(),
      periodtype = "day",
      pipelinekey = "twitter",
      tilex = 142,
      tiley = 120,
      tilez = 8,
      topic = "europe"
    ))
  }

  it should "produce an empty sequence on single keyword" in {
    val topics = CassandraConjunctiveTopics(Event(
      pipelinekey = "twitter",
      computedfeatures = Features(
        mentions = 1,
        sentiment = Sentiment(1.0),
        keywords = Seq("europe"),
        places = Seq(Place("abc123", 10.0, 20.0)),
        entities = Seq()
      ),
      eventtime = new Date().getTime,
      eventlangcode = "en",
      eventid = UUID.randomUUID().toString,
      insertiontime = new Date().getTime,
      body = "",
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
      insertiontime = new Date().getTime,
      body = "",
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
      insertiontime = new Date().getTime,
      body = "",
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
