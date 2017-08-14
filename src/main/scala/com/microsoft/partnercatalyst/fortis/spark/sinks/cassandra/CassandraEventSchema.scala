package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import java.util.Date

import com.microsoft.partnercatalyst.fortis.spark.dto.FortisEvent
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto._
import java.text.Collator
import java.util.Locale

import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.TileUtils.{DETAIL_ZOOM_DELTA, MAX_ZOOM, MIN_ZOOM}
import com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries.{Period, PeriodType}
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
      insertiontime = new Date().getTime,
      body = item.details.body,
      sourceurl = item.details.sourceurl,
      title = item.details.title)
  }
}

object CassandraPopularPlaces {
  def apply(item: Event): Seq[PopularPlaceAggregate] = {
    for {
      kw <- Utils.getConjunctiveTopics(Option(item.computedfeatures.keywords))
      location <- item.computedfeatures.places
      periodType <- Utils.getCassandraPeriodTypes
    } yield PopularPlaceAggregate(
      pipelinekey = item.pipelinekey,
      centroidlat = location.centroidlat,
      centroidlon = location.centroidlon,
      placeid = location.placeid,
      periodstartdate = Period(item.eventtime, periodType).startTime(),
      periodenddate = Period(item.eventtime, periodType).endTime(),
      periodtype = periodType.periodTypeName,
      period = periodType.format(item.eventtime),
      externalsourceid = item.externalsourceid,
      mentioncount = item.computedfeatures.mentions,
      conjunctiontopic1 = kw._1,
      conjunctiontopic2 = kw._2,
      conjunctiontopic3 = kw._3,
      avgsentimentnumerator = 0,
      avgsentiment = item.computedfeatures.sentiment.neg_avg
    )
  }
}

object CassandraPopularTopics {
  def apply(item: Event): Seq[PopularTopicAggregate] = {
    for {
      kw <- item.computedfeatures.keywords
      tileid <- TileUtils.tile_seq_from_places(item.computedfeatures.places)
      periodType <- Utils.getCassandraPeriodTypes
    } yield PopularTopicAggregate(
      pipelinekey = item.pipelinekey,
      periodstartdate = Period(item.eventtime, periodType).startTime(),
      periodenddate = Period(item.eventtime, periodType).endTime(),
      periodtype = periodType.periodTypeName,
      period = periodType.format(item.eventtime),
      tilex = tileid.column,
      tiley = tileid.row,
      tilez = tileid.zoom,
      topic = kw,
      externalsourceid = item.externalsourceid,
      mentioncount = item.computedfeatures.mentions,
      avgsentimentnumerator = 0,
      avgsentiment = item.computedfeatures.sentiment.neg_avg
    )
  }
}

object CassandraComputedTiles {
  def apply(item: Event): Seq[ComputedTile] = {
    for {
      ct <- Utils.getConjunctiveTopics(Option(item.computedfeatures.keywords))
      place <- item.computedfeatures.places
      periodType <- Utils.getCassandraPeriodTypes
      zoom <- MAX_ZOOM to MIN_ZOOM by -1
      tileId = TileUtils.tile_id_from_lat_long(place.centroidlat, place.centroidlon, zoom)
    } yield ComputedTile(
        pipelinekey = item.pipelinekey,
        periodstartdate = Period(item.eventtime, periodType).startTime(),
        periodenddate = Period(item.eventtime, periodType).endTime(),
        periodtype = periodType.periodTypeName,
        period = periodType.format(item.eventtime),
        tilex = tileId.column,
        tiley = tileId.row,
        tilez = tileId.zoom,
        detailtileid = TileUtils.tile_id_from_lat_long(place.centroidlat, place.centroidlon, zoom + DETAIL_ZOOM_DELTA).tileId,
        conjunctiontopic1 = ct._1,
        conjunctiontopic2 = ct._2,
        conjunctiontopic3 = ct._3,
        externalsourceid = item.externalsourceid,
        mentioncount = item.computedfeatures.mentions,
        avgsentimentnumerator = 0,
        avgsentiment = item.computedfeatures.sentiment.neg_avg
    )
  }
}

object CassandraEventTopicSchema {
  def apply(item: Event): Seq[EventTopics] = {
    for {
      kw <- item.computedfeatures.keywords
    } yield EventTopics(
      pipelinekey = item.pipelinekey,
      eventid = item.eventid,
      topic = kw.toLowerCase,
      eventime = item.eventtime,
      insertiontime = new Date().getTime,
      externalsourceid = item.externalsourceid
    )
  }
}

object CassandraEventPlacesSchema {
  def apply(item: Event): Seq[EventPlaces] = {
    for {
      ct <- Utils.getConjunctiveTopics(Option(item.computedfeatures.keywords))
      location <- item.computedfeatures.places
    } yield EventPlaces(
      pipelinekey = item.pipelinekey,
      centroidlat = location.centroidlat,
      centroidlon = location.centroidlon,
      eventid = item.eventid,
      eventime = item.eventtime,
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

          (sortedCombo(0), sortedCombo(1), sortedCombo(2))
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
    val zero = 0.toLong
    Features(
      mentions = 1,
      places = item.analysis.locations.map(place => Place(placeid = place.wofId, centroidlat = place.latitude.getOrElse(-1), centroidlon = place.longitude.getOrElse(-1))),
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