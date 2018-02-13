package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto

import net.liftweb.json

case class Sentiment(neg_avg: Double) extends Serializable

case class Gender(
  male_mentions: Long,
  female_mentions: Long
) extends Serializable

case class Entities(
  name: String,
  externalsource: String,
  externalrefid: String,
  count: Long
) extends Serializable

case class Place(
  placeid: String,
  centroidlat: Double,
  centroidlon: Double
) extends Serializable

case class Features(
  mentions: Long,
  sentiment: Sentiment,
  keywords: Seq[String],
  places: Seq[Place],
  entities: Seq[Entities]
) extends Serializable

object Features {
  def asJson(features: Features): String = {
    implicit val formats = json.DefaultFormats

    json.compactRender(json.Extraction.decompose(features))
  }

  def fromJson(features: String): Features = {
    implicit val formats = json.DefaultFormats

    json.parse(features).extract[Features]
  }
}
