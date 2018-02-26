package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import java.text.Collator
import java.util.{Date, Locale}

import com.microsoft.partnercatalyst.fortis.spark.dto.FortisEvent
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto._
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.TileUtils.{DETAIL_ZOOM_DELTA, DoubleToLongConversionFactor}
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations._
import org.apache.spark.rdd.RDD

object Constants {
  val KeyspaceName = "fortis"

  object Table {
    val ComputedTiles = "computedtiles"
    val ConjunctiveTopics = "conjunctivetopics"
    val Events = "events"
    val EventPlaces = "eventplaces"
    val EventPlacesByPipeline = "eventsbypipeline"
    val EventPlacesBySource = "eventplacesbysource"
    val HeatMap = "heatmap"
    val PopularPlaces = "popularplaces"
    val PopularSources = "popularsources"
    val PopularTopics = "populartopics"
  }
}

object CassandraEventSchema {
  def apply(item: FortisEvent, batchid: String): Event = {
    Event(
      pipelinekey = item.details.pipelinekey,
      externalsourceid = item.details.externalsourceid,
      computedfeatures_json = Utils.getFeaturesJson(item),
      eventtime = item.details.eventtime,
      batchid = batchid,
      eventlangcode = item.analysis.language.orNull,
      eventid = item.details.eventid,
      sourceeventid = item.details.sourceeventid,
      insertiontime = new Date().getTime,
      body = item.details.body,
      imageurl = item.details.imageurl,
      summary = item.analysis.summary.getOrElse(""),
      sourceurl = item.details.sourceurl,
      title = item.details.title)
  }
}

object CassandraConjunctiveTopics {

  def flatMapKeywords(item: Event): Seq[(String, String)] = {
    val computedfeatures = Features.fromJson(item.computedfeatures_json)

    val keywords = computedfeatures.keywords.distinct
    if (keywords.isEmpty)
      Seq()
    else
      keywords.map(k=>(k, "")) ++ keywords.combinations(2).flatMap(combination => Seq(
        (combination.head, combination(1)),
        (combination(1), combination.head
      )))
  }

  def apply(eventRDD: RDD[Event], minZoom: Int): RDD[ConjunctiveTopic] = {
    eventRDD.flatMap(item => {
      val computedfeatures = Features.fromJson(item.computedfeatures_json)
      val keywordPairs = flatMapKeywords(item)

      val tiles = TileUtils.tile_seq_from_places(computedfeatures.places, minZoom)

      for {
        kwPair <- keywordPairs
        tileid <- tiles
        periodType <- Utils.getCassandraPeriodTypes
      } yield ConjunctiveTopic(
        eventid = item.eventid,
        topic = kwPair._1,
        conjunctivetopic = kwPair._2,
        externalsourceid = item.externalsourceid,
        mentioncount = computedfeatures.mentions,
        perioddate = Period(item.eventtime, periodType).startTime(),
        periodtype = periodType.periodTypeName,
        pipelinekey = item.pipelinekey,
        tileid = tileid.tileId,
        tilez = tileid.zoom
      )
    })
  }
}

object TileRows {
  def apply(eventRDD: RDD[Event], minZoom: Int): RDD[TileRow] = {
    eventRDD.flatMap(item => {
      val computedfeatures = Features.fromJson(item.computedfeatures_json)

      for {
        ct <- Utils.getConjunctiveTopics(Option(computedfeatures.keywords))
        place <- computedfeatures.places
        zoom <- TileUtils.maxZoom(minZoom) to minZoom by -1
        tileId = TileUtils.tile_id_from_lat_long(place.centroidlat, place.centroidlon, zoom)
        periodType <- Utils.getCassandraPeriodTypes
      } yield TileRow(
        eventtime = item.eventtime,
        eventid = item.eventid,
        placeid = place.placeid,
        periodtype = periodType.periodTypeName,
        pipelinekey = item.pipelinekey,
        conjunctiontopic1 = ct._1,
        conjunctiontopic2 = ct._2,
        conjunctiontopic3 = ct._3,
        tilez = tileId.zoom,
        tileid = tileId.tileId,
        perioddate = Period(item.eventtime, periodType).startTime(),
        externalsourceid = item.externalsourceid,
        heatmaptileid = TileUtils.tile_id_from_lat_long(place.centroidlat, place.centroidlon, zoom + DETAIL_ZOOM_DELTA).tileId,
        centroidlat = place.centroidlat,
        centroidlon = place.centroidlon,
        mentioncount = computedfeatures.mentions,
        avgsentimentnumerator = (computedfeatures.sentiment.neg_avg * DoubleToLongConversionFactor).toLong,
        insertiontime = new Date().getTime
      )
    })
  }
}

object Utils {
  private val ConjunctiveTopicComboSize = 3
  private val DefaultPrimaryLanguage = "en"//TODO thread the site settings primary language to getConjunctiveTopics

  def getCassandraPeriodTypes: Seq[PeriodType] = {
    Seq(PeriodType.Day, PeriodType.Hour, PeriodType.Month, PeriodType.Week, PeriodType.Year)
  }

  def getConjunctiveTopics(topicSeq: Option[Seq[String]], langcode: Option[String] = None): Seq[(String, String, String)] = {
    topicSeq match {
      case Some(topics) =>
        (topics ++ Seq("", "")).toList.combinations(ConjunctiveTopicComboSize).toList.map(combo => {
          val sortedCombo = combo.sortWith{(a, b) =>
            Ordering.comparatorToOrdering(Collator.getInstance(new Locale(langcode.getOrElse(langcode.getOrElse(DefaultPrimaryLanguage))))).compare(a,b) < 0 && a != ""
          }

          (sortedCombo.head, sortedCombo(1), sortedCombo(2))
        })
      case None => Seq()
    }
  }

  def getSentimentScore(sentiments: List[Double]): Double = {
    Option(sentiments) match {
      case None => 0F
      case Some(_) if sentiments.isEmpty => 0f
      case Some(sentimentList) => sentimentList.head.toFloat
    }
  }

  def getFeaturesJson(item: FortisEvent): String = {
    //todo val genderCounts = item.analysis.genders.map(_.name).groupBy(identity).mapValues(t=>t.size.toLong)
    val entityCounts = item.analysis.entities.map(_.name).groupBy(identity).mapValues(t => t.size.toLong)
    val places = item.analysis.locations.map(place => Place(placeid = place.wofId, centroidlat = place.latitude, centroidlon = place.longitude))
    val keywords = item.analysis.keywords.map(_.name.toLowerCase)

    Features.asJson(Features(
      mentions = 1,
      places = places,
      keywords = keywords,
      sentiment = Sentiment(neg_avg = getSentimentScore(item.analysis.sentiments)),
      entities = entityCounts.map(kv => Entities(
        name = kv._1,
        count = kv._2,
        externalsource = "", // todo
        externalrefid = "" // todo
      )).toList))
  }

  def getFeatures(item: Event): Features = {
    Features.fromJson(item.computedfeatures_json)
  }
}