package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators

import java.util.{Date, UUID}

import com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries.Period
import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.dto.{Geofence, SiteSettings}
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto._
import org.apache.spark.rdd.RDD
import org.apache.spark.{SparkConf, SparkContext}
import org.mockito.{ArgumentMatchers, Mockito}
import org.scalatest.{BeforeAndAfter, FlatSpec}

class PopularPlacesOfflineAggregatorTestSpec extends FlatSpec with BeforeAndAfter {

  private var configurationManager: ConfigurationManager = _
  private var aggregator: PopularPlacesOfflineAggregator = _
  private var siteSettings: SiteSettings = _
  private val conf = new SparkConf()
    .setAppName(this.getClass.getSimpleName)
    .setMaster("local[*]")
    .set("output.consistency.level", "LOCAL_ONE")

  private var sc: SparkContext = _

  before {
    configurationManager = Mockito.mock(classOf[ConfigurationManager])
    aggregator = new PopularPlacesOfflineAggregator(configurationManager)
    sc = new SparkContext(conf)
    siteSettings = new SiteSettings(
      sitename = "Fortis",
      geofence = Seq(1, 2, 3, 4),
      defaultlanguage = Some("en"),
      languages = Seq("en", "es", "fr"),
      defaultzoom = 8,
      featureservicenamespace = Some("somenamespace"),
      title = "Fortis",
      logo = "",
      translationsvctoken = "",
      cogspeechsvctoken = "",
      cogvisionsvctoken = "",
      cogtextsvctoken = "",
      insertiontime = System.currentTimeMillis()
    )
    Mockito.when(configurationManager.fetchSiteSettings(ArgumentMatchers.any())).thenReturn(siteSettings)
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
      imageurl = None,
      summary = "",
      fulltext = "",
      batchid = UUID.randomUUID().toString,
      externalsourceid = "HamillHimself",
      topics = Seq[String](),
      placeids = Seq[String](),
      sourceurl = "",
      title = ""
    )))

    val eventsExploded = events.flatMap(event=>{
      Seq(
        event,
        event.copy(externalsourceid = "all"),
        event.copy(pipelinekey = "all", externalsourceid = "all")
      )
    })

    val popularPlaces = aggregator.aggregate(eventsExploded).collect()
    assert(popularPlaces.size == 165)

    val allall = popularPlaces.filter(topic=>topic.pipelinekey == "all" && topic.externalsourceid == "all" && topic.periodtype == "day" && topic.tilez == 8)
    assert(allall.toSet == Set(
      PopularPlace(
        externalsourceid = "all",
        perioddate = period.startTime(),
        periodtype = "day",
        pipelinekey = "all",
        mentioncount = 1,
        avgsentimentnumerator = 500,
        placeid = "wof-101731037",
        tileid = "8_120_142",
        tilez = 8,
        conjunctiontopic1 = "europe",
        conjunctiontopic2 = "",
        conjunctiontopic3 = ""
      )
    ))

    val externalsourceidAll = popularPlaces.filter(topic=>topic.pipelinekey != "all" && topic.externalsourceid == "all" && topic.periodtype == "day" && topic.tilez == 8)
    assert(externalsourceidAll.toSet == Set(
      PopularPlace(
        perioddate = period.startTime(),
        externalsourceid = "all",
        periodtype = "day",
        pipelinekey = "twitter",
        mentioncount = 1,
        avgsentimentnumerator = 500,
        placeid = "wof-101731037",
        tileid = "8_120_142",
        tilez = 8,
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
        imageurl = None,
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
        imageurl = None,
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

    val eventsExploded = events.flatMap(event=>{
      Seq(
        event,
        event.copy(externalsourceid = "all"),
        event.copy(pipelinekey = "all", externalsourceid = "all")
      )
    })

    val popularPlaces = aggregator.aggregate(eventsExploded).collect()
    assert(popularPlaces.size == 220)

    val allall = popularPlaces.filter(topic=>topic.pipelinekey == "all" && topic.externalsourceid == "all" && topic.periodtype == "day" && topic.tilez == 8)
    assert(allall.toSet == Set(
      PopularPlace(
        perioddate = period.startTime(),
        externalsourceid = "all",
        periodtype = "day",
        pipelinekey = "all",
        mentioncount = 2,
        avgsentimentnumerator = 1200,
        placeid = "wof-907128885",
        tileid = "8_120_142",
        tilez = 8,
        conjunctiontopic1 = "europe",
        conjunctiontopic2 = "",
        conjunctiontopic3 = ""
      )
    ))

    val externalsourceidAll = popularPlaces.filter(topic=>topic.pipelinekey != "all" && topic.externalsourceid == "all" && topic.periodtype == "day" && topic.tilez == 8)
    assert(externalsourceidAll.toSet == Set(
      PopularPlace(
        perioddate = period.startTime(),
        externalsourceid = "all",
        periodtype = "day",
        pipelinekey = "twitter",
        mentioncount = 2,
        avgsentimentnumerator = 1200,
        placeid = "wof-907128885",
        tileid = "8_120_142",
        tilez = 8,
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
        imageurl = None,
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
        imageurl = None,
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

    val eventsExploded = events.flatMap(event=>{
      Seq(
        event,
        event.copy(externalsourceid = "all"),
        event.copy(pipelinekey = "all", externalsourceid = "all")
      )
    })

    val popularPlaces = aggregator.aggregate(eventsExploded).collect()
    assert(popularPlaces.size == 275)

    val allall = popularPlaces.filter(topic=>topic.pipelinekey == "all" && topic.externalsourceid == "all" && topic.periodtype == "day" && topic.tilez == 8)
    assert(allall.toSet == Set(
      PopularPlace(
        perioddate = period.startTime(),
        externalsourceid = "all",
        periodtype = "day",
        pipelinekey = "all",
        mentioncount = 2,
        avgsentimentnumerator = 1200,
        placeid = "wof-907128885",
        tileid = "8_120_142",
        tilez = 8,
        conjunctiontopic1 = "europe",
        conjunctiontopic2 = "",
        conjunctiontopic3 = ""
      )
    ))

    val externalsourceidAll = popularPlaces.filter(topic=>topic.pipelinekey != "all" && topic.externalsourceid == "all" && topic.periodtype == "day" && topic.tilez == 8)
    assert(externalsourceidAll.toSet == Set(
      PopularPlace(
        perioddate = period.startTime(),
        externalsourceid = "all",
        periodtype = "day",
        pipelinekey = "twitter",
        mentioncount = 1,
        avgsentimentnumerator = 700,
        placeid = "wof-907128885",
        tileid = "8_120_142",
        tilez = 8,
        conjunctiontopic1 = "europe",
        conjunctiontopic2 = "",
        conjunctiontopic3 = ""
      ),
      PopularPlace(
        perioddate = period.startTime(),
        externalsourceid = "all",
        periodtype = "day",
        pipelinekey = "facebook",
        mentioncount = 1,
        avgsentimentnumerator = 500,
        placeid = "wof-907128885",
        tileid = "8_120_142",
        tilez = 8,
        conjunctiontopic1 = "europe",
        conjunctiontopic2 = "",
        conjunctiontopic3 = ""
      )
    ))
  }
}
