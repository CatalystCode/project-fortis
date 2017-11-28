package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import java.text.Collator
import java.util.{Date, Locale}

import com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries.{Period, PeriodType}
import com.microsoft.partnercatalyst.fortis.spark.dto.FortisEvent
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto._
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.udfs.FortisUdfFunctions
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.TileUtils.DETAIL_ZOOM_DELTA
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations._

object CassandraEventSchema {
  def apply(item: FortisEvent, batchid: String): Event = {
    Event(
      pipelinekey = item.details.pipelinekey,
      externalsourceid = item.details.externalsourceid,
      computedfeatures = Utils.getFeatures(item),
      eventtime = item.details.eventtime,
      batchid = batchid,
      topics = item.analysis.keywords.map(_.name.toLowerCase),
      fulltext = s"[${Option(item.details.title).getOrElse("")}] - ${item.details.body}",
      placeids = item.analysis.locations.map(_.wofId),
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

object CassandraPopularPlaces {
  def apply(item: Event, minZoom: Int): Seq[PopularPlace] = {
    for {
      kw <- Utils.getConjunctiveTopics(Option(item.computedfeatures.keywords))
      location <- item.computedfeatures.places
      periodType <- Utils.getCassandraPeriodTypes
      zoom <- TileUtils.maxZoom(minZoom) to minZoom by -1
      tileid = TileUtils.tile_id_from_lat_long(location.centroidlat, location.centroidlon, zoom)
    } yield PopularPlace(
      pipelinekey = item.pipelinekey,
      placeid = location.placeid,
      tilez = tileid.zoom,
      tileid = tileid.tileId,
      perioddate = Period(item.eventtime, periodType).startTime(),
      periodtype = periodType.periodTypeName,
      externalsourceid = item.externalsourceid,
      mentioncount = item.computedfeatures.mentions,
      conjunctiontopic1 = kw._1,
      conjunctiontopic2 = kw._2,
      conjunctiontopic3 = kw._3,
      avgsentimentnumerator = (item.computedfeatures.sentiment.neg_avg * FortisUdfFunctions.DoubleToLongConversionFactor).toLong
    )
  }
}

object CassandraConjunctiveTopics {

  def flatMapKeywords(item: Event): Seq[(String, String)] = {
    val keywords = item.computedfeatures.keywords.toSet.toSeq
    if (keywords.isEmpty) Seq() else keywords.map(k=>(k, "")) ++ keywords.combinations(2).flatMap(combination => Seq(
      (combination.head, combination(1)),
      (combination(1), combination.head
      )))
  }

  def apply(item: Event, minZoom: Int): Seq[ConjunctiveTopic] = {
    val keywords = item.computedfeatures.keywords
    val keywordPairs = flatMapKeywords(item)

    val tiles = TileUtils.tile_seq_from_places(item.computedfeatures.places, minZoom)

    for {
      kwPair <- keywordPairs
      tileid <- tiles
      periodType <- Utils.getCassandraPeriodTypes
    } yield ConjunctiveTopic(
      topic = kwPair._1,
      conjunctivetopic = kwPair._2,
      externalsourceid = item.externalsourceid,
      mentioncount = item.computedfeatures.mentions,
      perioddate = Period(item.eventtime, periodType).startTime(),
      periodtype = periodType.periodTypeName,
      pipelinekey = item.pipelinekey,
      tileid = tileid.tileId,
      tilez = tileid.zoom
    )
  }
}

object CassandraTileBucket {
  def apply(item: HeatmapTile): ComputedTile = {
    ComputedTile(
      pipelinekey = item.pipelinekey,
      mentioncount = item.mentioncount,
      avgsentimentnumerator = item.avgsentimentnumerator,
      externalsourceid = item.externalsourceid,
      perioddate = item.perioddate,
      conjunctiontopic1 = item.conjunctiontopic1,
      conjunctiontopic2 = item.conjunctiontopic2,
      conjunctiontopic3 = item.conjunctiontopic3,
      tilez = item.tilez,
      tileid = item.tileid,
      periodtype = item.periodtype
    )
  }
}

object CassandraHeatmapTiles {
  def apply(item: Event, minZoom: Int): Seq[HeatmapTile] = {
    for {
      ct <- Utils.getConjunctiveTopics(Option(item.computedfeatures.keywords))
      place <- item.computedfeatures.places
      periodType <- Utils.getCassandraPeriodTypes
      zoom <- TileUtils.maxZoom(minZoom) to minZoom by -1
      tileId = TileUtils.tile_id_from_lat_long(place.centroidlat, place.centroidlon, zoom)
    } yield HeatmapTile(
        pipelinekey = item.pipelinekey,
        perioddate = Period(item.eventtime, periodType).startTime(),
        periodtype = periodType.periodTypeName,
        tileid = tileId.tileId,
        tilez = tileId.zoom,
        heatmaptileid = TileUtils.tile_id_from_lat_long(place.centroidlat, place.centroidlon, zoom + DETAIL_ZOOM_DELTA).tileId,
        conjunctiontopic1 = ct._1,
        conjunctiontopic2 = ct._2,
        conjunctiontopic3 = ct._3,
        externalsourceid = item.externalsourceid,
        mentioncount = item.computedfeatures.mentions,
        avgsentimentnumerator = (item.computedfeatures.sentiment.neg_avg * FortisUdfFunctions.DoubleToLongConversionFactor).toLong
    )
  }
}

object CassandraEventPlacesSchema {
  def apply(item: Event, minZoom: Int): Seq[EventPlaces] = {
    for {
      ct <- Utils.getConjunctiveTopics(Option(item.computedfeatures.keywords))
      location <- item.computedfeatures.places
      zoom <- TileUtils.maxZoom(minZoom) to minZoom by -1
      tileid = TileUtils.tile_id_from_lat_long(location.centroidlat, location.centroidlon, zoom)
    } yield EventPlaces(
      pipelinekey = item.pipelinekey,
      centroidlat = location.centroidlat,
      centroidlon = location.centroidlon,
      eventid = item.eventid,
      eventtime = item.eventtime,
      tileid = tileid.tileId,
      tilez = tileid.zoom,
      conjunctiontopic1 = ct._1,
      conjunctiontopic2 = ct._2,
      conjunctiontopic3 = ct._3,
      insertiontime = new Date().getTime,
      externalsourceid = item.externalsourceid,
      placeid = location.placeid
    )
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

  def getFeatures(item: FortisEvent): Features = {
    //todo val genderCounts = item.analysis.genders.map(_.name).groupBy(identity).mapValues(t=>t.size.toLong)
    val entityCounts = item.analysis.entities.map(_.name).groupBy(identity).mapValues(t=>t.size.toLong)
    Features(
      mentions = 1,
      places = item.analysis.locations.map(place => Place(placeid = place.wofId, centroidlat = place.latitude, centroidlon = place.longitude)),
      keywords = item.analysis.keywords.map(_.name),
      sentiment = Sentiment(neg_avg = getSentimentScore(item.analysis.sentiments)),
      entities = entityCounts.map(kv => Entities(
        name = kv._1,
        count = kv._2,
        externalsource = "", // todo
        externalrefid = "" // todo
      )).toList)
  }
}