package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import java.util.{Date, UUID}

import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto.{Event, Features, Place, Sentiment}
import org.apache.spark.{SparkConf, SparkContext}
import org.scalatest.{BeforeAndAfter, FlatSpec}

class CassandraConjunctiveTopicsTestSpecRdd extends FlatSpec with BeforeAndAfter {
  private val conf = new SparkConf()
    .setAppName(this.getClass.getSimpleName)
    .setMaster("local[*]")
    .set("output.consistency.level", "LOCAL_ONE")

  private var sc: SparkContext = _

  before {
    sc = new SparkContext(conf)
  }

  after {
    sc.stop()
  }

  it should "produce an non-empty sequence" in {
    val zoom = 8

    val events = Seq(Event(
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
    ))

    val topics = CassandraConjunctiveTopics(sc.parallelize(events), zoom)

    assert(topics.count() == 180)

    // TODO
    /*
    val firstTopic = topics.zipWithIndex.map({ case (k, v) => (v, k)}).lookup(1)
    assert(firstTopic == ConjunctiveTopic(
      conjunctivetopic = "",
      externalsourceid = "HamillHimself",
      mentioncount = 1,
      perioddate =  period.startTime(),
      periodtype = "day",
      pipelinekey = "Twitter",
      tileid = "8_120_142",
      tilez = 8,
      topic = "europe"
    ))
    */
  }

  it should "produce a non-empty sequence on single keyword" in {
    val zoom = 8

    val events = Seq(Event(
      pipelinekey = "Twitter",
      computedfeatures_json = Features.asJson(Features(
        mentions = 1,
        sentiment = Sentiment(1.0),
        keywords = Seq("europe"),
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
    ))

    val topics = CassandraConjunctiveTopics(sc.parallelize(events), zoom)

    assert(topics.count() == 45)

    // TODO
    /*
    assert(topics.head == ConjunctiveTopic(
      conjunctivetopic = "",
      externalsourceid = "HamillHimself",
      mentioncount = 1,
      perioddate =  period.startTime(),
      periodtype = "day",
      pipelinekey = "Twitter",
      tileid = "8_120_142",
      tilez = 8,
      topic = "europe"
    ))
    */
  }

  it should "produce an empty sequence on empty places" in {
    val zoom = 8

    val events = Seq(Event(
      pipelinekey = "Twitter",
      computedfeatures_json = Features.asJson(Features(
        mentions = 1,
        sentiment = Sentiment(1.0),
        keywords = Seq("europe", "humanitarian"),
        places = Seq(),
        entities = Seq()
      )),
      eventtime = new Date().getTime,
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
    ))

    val topics = CassandraConjunctiveTopics(sc.parallelize(events), zoom)

    assert(topics.count() == 0)
  }

  it should "produce an empty sequence on empty keywords" in {
    val zoom = 8

    val events = Seq(Event(
      pipelinekey = "Twitter",
      computedfeatures_json = Features.asJson(Features(
        mentions = 1,
        sentiment = Sentiment(1.0),
        keywords = Seq(),
        places = Seq(Place("abc123", 10.0, 20.0)),
        entities = Seq()
      )),
      eventtime = new Date().getTime,
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
    ))

    val topics = CassandraConjunctiveTopics(sc.parallelize(events), zoom)

    assert(topics.count() == 0)
  }
}
