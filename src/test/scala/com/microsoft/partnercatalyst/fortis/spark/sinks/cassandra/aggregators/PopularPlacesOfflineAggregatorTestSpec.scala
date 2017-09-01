package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators

import java.util.{Date, UUID}

import com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries.Period
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto._
import org.apache.spark.rdd.RDD
import org.apache.spark.{SparkConf, SparkContext}
import org.scalatest.{BeforeAndAfter, FlatSpec}

class PopularPlacesOfflineAggregatorTestSpec extends FlatSpec with BeforeAndAfter {

  private val aggregator = new PopularPlacesOfflineAggregator()
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

  it should "produce an all/all aggregates for single event" in {
    val period = Period("day-2017-08-11")
    val events: RDD[Event] = sc.parallelize(Seq(Event(
      pipelinekey = "twitter",
      computedfeatures = Features(
        mentions = 1,
        sentiment = Sentiment(0.5),
        keywords = Seq("europe"),
        places = Seq(Place("wof-101731037", 10.0, 20.0)),
        entities = Seq[Entities]()
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
      topics = Seq[String](),
      placeids = Seq[String](),
      sourceurl = "",
      title = ""
    )))

    val popularPlaces = aggregator.aggregate(events).collect()
    assert(popularPlaces.size == 15)

    val allall = popularPlaces.filter(topic=>topic.pipelinekey == "all" && topic.externalsourceid == "all" && topic.periodtype == "day")
    assert(allall.toSet == Set(
      PopularPlace(
        periodstartdate = period.startTime(),
        externalsourceid = "all",
        periodenddate = period.endTime(),
        periodtype = "day",
        period = period.toString,
        pipelinekey = "all",
        mentioncount = 1,
        avgsentimentnumerator = 500,
        placeid = "wof-101731037",
        centroidlat = 10,
        centroidlon = 20,
        conjunctiontopic1 = "europe",
        conjunctiontopic2 = "",
        conjunctiontopic3 = ""
      )
    ))

    val externalsourceidAll = popularPlaces.filter(topic=>topic.pipelinekey != "all" && topic.externalsourceid == "all" && topic.periodtype == "day")
    assert(externalsourceidAll.toSet == Set(
      PopularPlace(
        periodstartdate = period.startTime(),
        externalsourceid = "all",
        periodenddate = period.endTime(),
        periodtype = "day",
        period = period.toString,
        pipelinekey = "twitter",
        mentioncount = 1,
        avgsentimentnumerator = 500,
        placeid = "wof-101731037",
        centroidlat = 10,
        centroidlon = 20,
        conjunctiontopic1 = "europe",
        conjunctiontopic2 = "",
        conjunctiontopic3 = ""
      )
    ))
  }

  it should "produce an all/all aggregates for two events in the same pipeline" in {
    val period = Period("day-2017-08-11")
    val events: RDD[Event] = sc.parallelize(Seq(
      Event(
        pipelinekey = "twitter",
        computedfeatures = Features(
          mentions = 1,
          sentiment = Sentiment(0.7),
          keywords = Seq("europe"),
          places = Seq(Place("wof-907128885", 10.0, 20.0)),
          entities = Seq[Entities]()
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
        externalsourceid = "carrieffisher",
        topics = Seq[String](),
        placeids = Seq[String](),
        sourceurl = "",
        title = ""
      ),
      Event(
        pipelinekey = "twitter",
        computedfeatures = Features(
          mentions = 1,
          sentiment = Sentiment(0.5),
          keywords = Seq("europe"),
          places = Seq(Place("wof-907128885", 10.0, 20.0)),
          entities = Seq[Entities]()
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
        topics = Seq[String](),
        placeids = Seq[String](),
        sourceurl = "",
        title = ""
      )
    ))

    val popularPlaces = aggregator.aggregate(events).collect()
    assert(popularPlaces.size == 20)

    val allall = popularPlaces.filter(topic=>topic.pipelinekey == "all" && topic.externalsourceid == "all" && topic.periodtype == "day")
    assert(allall.toSet == Set(
      PopularPlace(
        periodstartdate = period.startTime(),
        externalsourceid = "all",
        periodenddate = period.endTime(),
        periodtype = "day",
        period = period.toString,
        pipelinekey = "all",
        mentioncount = 2,
        avgsentimentnumerator = 1200,
        placeid = "wof-907128885",
        centroidlat = 10,
        centroidlon = 20,
        conjunctiontopic1 = "europe",
        conjunctiontopic2 = "",
        conjunctiontopic3 = ""
      )
    ))

    val externalsourceidAll = popularPlaces.filter(topic=>topic.pipelinekey != "all" && topic.externalsourceid == "all" && topic.periodtype == "day")
    assert(externalsourceidAll.toSet == Set(
      PopularPlace(
        periodstartdate = period.startTime(),
        externalsourceid = "all",
        periodenddate = period.endTime(),
        periodtype = "day",
        period = period.toString,
        pipelinekey = "twitter",
        mentioncount = 2,
        avgsentimentnumerator = 1200,
        placeid = "wof-907128885",
        centroidlat = 10,
        centroidlon = 20,
        conjunctiontopic1 = "europe",
        conjunctiontopic2 = "",
        conjunctiontopic3 = ""
      )
    ))
  }

  it should "produce an all/all aggregates for two events in different pipelines" in {
    val period = Period("day-2017-08-11")
    val events: RDD[Event] = sc.parallelize(Seq(
      Event(
        pipelinekey = "twitter",
        computedfeatures = Features(
          mentions = 1,
          sentiment = Sentiment(0.7),
          keywords = Seq("europe"),
          places = Seq(Place("wof-907128885", 10.0, 20.0)),
          entities = Seq[Entities]()
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
        externalsourceid = "carrieffisher",
        topics = Seq[String](),
        placeids = Seq[String](),
        sourceurl = "",
        title = ""
      ),
      Event(
        pipelinekey = "facebook",
        computedfeatures = Features(
          mentions = 1,
          sentiment = Sentiment(0.5),
          keywords = Seq("europe"),
          places = Seq(Place("wof-907128885", 10.0, 20.0)),
          entities = Seq[Entities]()
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
        topics = Seq[String](),
        placeids = Seq[String](),
        sourceurl = "",
        title = ""
      )
    ))

    val popularPlaces = aggregator.aggregate(events).collect()
    assert(popularPlaces.size == 25)

    val allall = popularPlaces.filter(topic=>topic.pipelinekey == "all" && topic.externalsourceid == "all" && topic.periodtype == "day")
    assert(allall.toSet == Set(
      PopularPlace(
        periodstartdate = period.startTime(),
        externalsourceid = "all",
        periodenddate = period.endTime(),
        periodtype = "day",
        period = period.toString,
        pipelinekey = "all",
        mentioncount = 2,
        avgsentimentnumerator = 1200,
        placeid = "wof-907128885",
        centroidlat = 10,
        centroidlon = 20,
        conjunctiontopic1 = "europe",
        conjunctiontopic2 = "",
        conjunctiontopic3 = ""
      )
    ))

    val externalsourceidAll = popularPlaces.filter(topic=>topic.pipelinekey != "all" && topic.externalsourceid == "all" && topic.periodtype == "day")
    assert(externalsourceidAll.toSet == Set(
      PopularPlace(
        periodstartdate = period.startTime(),
        externalsourceid = "all",
        periodenddate = period.endTime(),
        periodtype = "day",
        period = period.toString,
        pipelinekey = "twitter",
        mentioncount = 1,
        avgsentimentnumerator = 700,
        placeid = "wof-907128885",
        centroidlat = 10,
        centroidlon = 20,
        conjunctiontopic1 = "europe",
        conjunctiontopic2 = "",
        conjunctiontopic3 = ""
      ),
      PopularPlace(
        periodstartdate = period.startTime(),
        externalsourceid = "all",
        periodenddate = period.endTime(),
        periodtype = "day",
        period = period.toString,
        pipelinekey = "facebook",
        mentioncount = 1,
        avgsentimentnumerator = 500,
        placeid = "wof-907128885",
        centroidlat = 10,
        centroidlon = 20,
        conjunctiontopic1 = "europe",
        conjunctiontopic2 = "",
        conjunctiontopic3 = ""
      )
    ))
  }
}
