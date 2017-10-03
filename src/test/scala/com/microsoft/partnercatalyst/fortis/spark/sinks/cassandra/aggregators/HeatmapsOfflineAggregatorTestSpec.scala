package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators

import java.util.{Date, UUID}

import com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries.Period
import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.dto.SiteSettings
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto._
import org.apache.spark.{SparkConf, SparkContext}
import org.apache.spark.rdd.RDD
import org.mockito.{ArgumentMatchers, Mockito}
import org.scalatest.{BeforeAndAfter, FlatSpec}

class HeatmapsOfflineAggregatorTestSpec  extends FlatSpec with BeforeAndAfter {
    private var configurationManager: ConfigurationManager = _
    private var aggregator: HeatmapOfflineAggregator = _
    private var siteSettings: SiteSettings = _
    private val conf = new SparkConf()
      .setAppName(this.getClass.getSimpleName)
      .setMaster("local[*]")
      .set("output.consistency.level", "LOCAL_ONE")

    private var sc: SparkContext = _

    before {
      configurationManager = Mockito.mock(classOf[ConfigurationManager])
      sc = new SparkContext(conf)
      aggregator = new HeatmapOfflineAggregator(configurationManager)
      siteSettings = new SiteSettings(
        sitename = "Fortis",
        geofence = Seq(1, 2, 3, 4),
        defaultlanguage = Some("en"),
        languages = Seq("en", "es", "fr"),
        defaultzoom = 6,
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
        pipelinekey = "RSS",
        computedfeatures = Features(
          mentions = 1,
          sentiment = Sentiment(1.0),
          keywords = Seq("colombia", "fuerza aerea", "herido", "huracan", "verdad"),
          places = Seq(Place("divipola-05001100000000", 6.24604, -75.58013),
                       Place("divipola-76823100000000", 4.60785, -76.07739),
                       Place("divipola-52001", 1.05578, -77.19551)),
          entities = Seq[Entities]()
        ),
        eventtime = period.startTime(),
        eventlangcode = "en",
        eventid = "http://www.cancilleria.gov.co/rss.xml",
        sourceeventid = UUID.randomUUID().toString,
        insertiontime = new Date().getTime,
        body = "",
        imageurl = None,
        summary = "",
        fulltext = "",
        batchid = UUID.randomUUID().toString,
        externalsourceid = "http://www.cancilleria.gov.co/newsroom/news/proximas-horas-llegara-pais-segundo-avion-colombianos-repatriados-puerto-rico",
        topics = Seq[String](),
        placeids = Seq[String](),
        sourceurl = "",
        title = ""
      ),
        Event(
          pipelinekey = "RSS",
          computedfeatures = Features(
            mentions = 1,
            sentiment = Sentiment(1.0),
            keywords = Seq("eln", "herido", "combate"),
            places = Seq(Place("divipola-27", 5.94302, -76.94238),
                         Place("divipola-27372100000000", 7.10349, -77.76281)),
            entities = Seq[Entities]()
          ),
          eventtime = period.startTime(),
          eventlangcode = "en",
          eventid = " RSS.http://casanare.extra.com.co/noticias/judicial/traslado-aeromedico-para-guerrillero-del-eln-herido-en-comba-353329",
          sourceeventid = UUID.randomUUID().toString,
          insertiontime = new Date().getTime,
          body = "",
          imageurl = None,
          summary = "",
          fulltext = "",
          batchid = UUID.randomUUID().toString,
          externalsourceid = "http://casanare.extra.com.co/rss.xml",
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

      val heatmaptiles = aggregator.aggregate(eventsExploded)
      val tileBuckets = aggregator.aggregateTileBuckets(heatmaptiles)
      val heatmaptilescollection = heatmaptiles.collect()
      val tileBucketsscollection = tileBuckets.collect()

      assert(heatmaptiles.collect.size == 12015)
      assert(tileBuckets.collect.size == 11420)

      val filteredTopics = heatmaptilescollection.filter(topic=>topic.pipelinekey == "all" && topic.externalsourceid == "all" && topic.periodtype == "day" && topic.tilez == 8)
      assert(filteredTopics.size == 89)
    }
}
