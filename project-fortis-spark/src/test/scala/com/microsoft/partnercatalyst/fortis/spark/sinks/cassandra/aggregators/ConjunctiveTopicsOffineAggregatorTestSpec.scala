package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators

import java.util.{Date, UUID}

import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.dto.{Geofence, SiteSettings}
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.Period
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto._
import org.apache.spark.rdd.RDD
import org.apache.spark.{SparkConf, SparkContext}
import org.mockito.{ArgumentMatchers, Mockito}
import org.scalatest.{BeforeAndAfter, FlatSpec}

class ConjunctiveTopicsOffineAggregatorTestSpec extends FlatSpec with BeforeAndAfter {

  private var configurationManager: ConfigurationManager = _
  private var aggregator: ConjunctiveTopicsOffineAggregator = _
  private var siteSettings: SiteSettings = _
  private val conf = new SparkConf()
    .setAppName(this.getClass.getSimpleName)
    .setMaster("local[*]")
    .set("output.consistency.level", "LOCAL_ONE")

  private var sc: SparkContext = _

  before {
    configurationManager = Mockito.mock(classOf[ConfigurationManager])
    aggregator = new ConjunctiveTopicsOffineAggregator(configurationManager)
    sc = new SparkContext(conf)
    siteSettings = new SiteSettings(
      sitename = "Fortis",
      geofence_json = "[1, 2, 3, 4]",
      defaultlanguage = Some("en"),
      languages_json = "[\"en\", \"es\", \"fr\"]",
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
      pipelinekey = "Twitter",
      computedfeatures_json = Features.asJson(Features(
        mentions = 1,
        sentiment = Sentiment(1.0),
        keywords = Seq("europe"),
        places = Seq(Place("abc123", 10.0, 20.0)),
        entities = Seq[Entities]()
      )),
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

    val topics = aggregator.aggregate(eventsExploded).collect()
    assert(topics.size == 135)

    val filteredTopics = topics.filter(topic=>topic.pipelinekey == "all" && topic.externalsourceid == "all" && topic.periodtype == "day" && topic.tilez == 8)
    assert(filteredTopics.size == 1)
    assert(filteredTopics.head == ConjunctiveTopic(
      conjunctivetopic = "",
      externalsourceid = "all",
      mentioncount = 1,
      perioddate =  period.startTime(),
      periodtype = "day",
      pipelinekey = "all",
      tileid = "8_120_142",
      tilez = 8,
      topic = "europe"
    ))
  }

  it should "produce an all/all aggregates for two events in the same pipeline" in {
    val period = Period("day-2017-08-11")
    val events: RDD[Event] = sc.parallelize(Seq(
        Event(
          pipelinekey = "Twitter",
          computedfeatures_json = Features.asJson(Features(
            mentions = 1,
            sentiment = Sentiment(1.0),
            keywords = Seq("europe"),
            places = Seq(Place("abc123", 10.0, 20.0)),
            entities = Seq[Entities]()
          )),
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
          sourceurl = "",
          title = ""
        ),
      Event(
        pipelinekey = "Twitter",
        computedfeatures_json = Features.asJson(Features(
          mentions = 1,
          sentiment = Sentiment(1.0),
          keywords = Seq("europe"),
          places = Seq(Place("abc123", 10.0, 20.0)),
          entities = Seq[Entities]()
        )),
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

    val topics = aggregator.aggregate(eventsExploded).collect()
    assert(topics.size == 180)

    val allSourcesTopics = topics.filter(topic=>topic.pipelinekey != "all" && topic.externalsourceid == "all" && topic.periodtype == "day" && topic.tilez == 8)
    assert(allSourcesTopics.size == 1)
    assert(allSourcesTopics.head == ConjunctiveTopic(
      conjunctivetopic = "",
      externalsourceid = "all",
      mentioncount = 2,
      perioddate =  period.startTime(),
      periodtype = "day",
      pipelinekey = "Twitter",
      tileid = "8_120_142",
      tilez = 8,
      topic = "europe"
    ))

    val allPipelinesTopics = topics.filter(topic=>topic.pipelinekey == "all" && topic.externalsourceid == "all" && topic.periodtype == "day" && topic.tilez == 8)
    assert(allPipelinesTopics.size == 1)
    assert(allPipelinesTopics.head == ConjunctiveTopic(
      conjunctivetopic = "",
      externalsourceid = "all",
      mentioncount = 2,
      perioddate =  period.startTime(),
      periodtype = "day",
      pipelinekey = "all",
      tileid = "8_120_142",
      tilez = 8,
      topic = "europe"
    ))
  }

  it should "produce an all/all aggregates for two events in different pipelines" in {
    val period = Period("day-2017-08-11")
    val events: RDD[Event] = sc.parallelize(Seq(
      Event(
        pipelinekey = "facebook",
        computedfeatures_json = Features.asJson(Features(
          mentions = 1,
          sentiment = Sentiment(1.0),
          keywords = Seq("europe"),
          places = Seq(Place("abc123", 10.0, 20.0)),
          entities = Seq[Entities]()
        )),
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
        sourceurl = "",
        title = ""
      ),
      Event(
        pipelinekey = "Twitter",
        computedfeatures_json = Features.asJson(Features(
          mentions = 1,
          sentiment = Sentiment(1.0),
          keywords = Seq("europe"),
          places = Seq(Place("abc123", 10.0, 20.0)),
          entities = Seq[Entities]()
        )),
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

    val topics = aggregator.aggregate(eventsExploded).collect()
    assert(topics.size == 225)

    val allSourcesTopics = topics.filter(topic=>topic.pipelinekey != "all" && topic.externalsourceid == "all" && topic.periodtype == "day" && topic.tilez == 8)
    assert(allSourcesTopics.size == 2)
    assert(allSourcesTopics.toSet == Set(
      ConjunctiveTopic(
        conjunctivetopic = "",
        externalsourceid = "all",
        mentioncount = 1,
        perioddate =  period.startTime(),
        periodtype = "day",
        pipelinekey = "Twitter",
        tileid = "8_120_142",
        tilez = 8,
        topic = "europe"
      ),
      ConjunctiveTopic(
        conjunctivetopic = "",
        externalsourceid = "all",
        mentioncount = 1,
        perioddate =  period.startTime(),
        periodtype = "day",
        pipelinekey = "facebook",
        tileid = "8_120_142",
        tilez = 8,
        topic = "europe"
      )
    ))

    val allPipelinesTopics = topics.filter(topic=>topic.pipelinekey == "all" && topic.externalsourceid == "all" && topic.periodtype == "day" && topic.tilez == 8)
    assert(allPipelinesTopics.size == 1)
    assert(allPipelinesTopics.head == ConjunctiveTopic(
      conjunctivetopic = "",
      externalsourceid = "all",
      mentioncount = 2,
      perioddate =  period.startTime(),
      periodtype = "day",
      pipelinekey = "all",
      tileid = "8_120_142",
      tilez = 8,
      topic = "europe"
    ))
  }

}
