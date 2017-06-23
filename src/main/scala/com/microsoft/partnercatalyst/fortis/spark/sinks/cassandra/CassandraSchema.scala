package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import java.time.Instant.now
import java.util.UUID

import com.microsoft.partnercatalyst.fortis.spark.dto.AnalyzedItem
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.Utils.{mean, rescale}
import com.microsoft.partnercatalyst.fortis.spark.transforms.gender.GenderDetector.{Female, Male}
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector.Neutral

case class Sentiment(
  pos_avg: Float,
  neg_avg: Float)

case class Gender(
  male_mentions: Int,
  female_mentions: Int)

case class Entities(
  name: String,
  externalsource: String,
  externalrefid: String,
  count: Float)

case class Features(
  mentions: Int,
  sentiment: Sentiment,
  gender: Gender,
  entities: Set[Entities])

case class Event(
  pipeline: String,
  externalid: String,
  computedfeatures: Features,
  detectedkeywords: Set[String],
  detectedplaceids: Set[String],
  event_time: Long,
  eventlangcode: String,
  id: UUID,
  insertion_time: Long,
  messagebody: String,
  sourceid: String,
  sourceurl: String,
  title: String)

object CassandraSchema {
  def apply(item: AnalyzedItem): Event = {
    Event(
      pipeline = item.publisher,
      externalid = "", // todo
      computedfeatures = getFeature(item),
      detectedkeywords = item.analysis.keywords.map(_.name).toSet,
      detectedplaceids = item.analysis.locations.map(_.wofId).toSet,
      event_time = item.createdAtEpoch,
      eventlangcode = item.analysis.language.orNull,
      id = item.id,
      insertion_time = now.getEpochSecond,
      messagebody = item.body,
      sourceid = "", // todo
      sourceurl = item.sourceUrl,
      title = item.title)
  }

  private def getFeature(item: AnalyzedItem): Features = {
    val genderCounts = item.analysis.genders.map(_.name).groupBy(identity).mapValues(_.size)
    val entityCounts = item.analysis.entities.map(_.name).groupBy(identity).mapValues(_.size)
    val positiveSentiments = item.analysis.sentiments.filter(_ > Neutral)
    val negativeSentiments = item.analysis.sentiments.filter(_ < Neutral)
    Features(
      mentions = -1,
      sentiment = Sentiment(
        pos_avg = rescale(positiveSentiments, 0, 1).flatMap(mean).map(_.toFloat).getOrElse(-1),
        neg_avg = rescale(negativeSentiments, 0, 1).flatMap(mean).map(_.toFloat).getOrElse(-1)),
      gender = Gender(
        male_mentions = genderCounts.getOrElse(Male, -1),
        female_mentions = genderCounts.getOrElse(Female, -1)),
      entities = entityCounts.map(kv => Entities(
        name = kv._1,
        count = kv._2,
        externalsource = "", // todo
        externalrefid = "" // todo
      )).toSet)
  }
}

object Utils {
  def mean(items: List[Double]): Option[Double] = {
    if (items.isEmpty) {
      return None
    }

    Some(items.sum / items.length)
  }

  /** @see https://stats.stackexchange.com/a/25897 */
  def rescale(items: List[Double], min_new: Double, max_new: Double): Option[List[Double]] = {
    if (items.isEmpty) {
      return None
    }

    val min_old = items.min
    val max_old = items.max
    if (max_old == min_old) {t
      return None
    }

    val coef = (max_new - min_new) / (max_old - min_old)
    Some(items.map(v => coef * (v - max_old) + max_new))
  }
}
