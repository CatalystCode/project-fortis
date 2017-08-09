package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto

case class Sentiment(neg_avg: Double) extends Serializable

case class Gender(
                   male_mentions: Long,
                   female_mentions: Long) extends Serializable

case class Entities(
                     name: String,
                     externalsource: String,
                     externalrefid: String,
                     count: Long) extends Serializable

case class Place(
                  placeid: String,
                  centroidlat: Double,
                  centroidlon: Double) extends Serializable

case class Features(
                     mentions: Long,
                     sentiment: Sentiment,
                     keywords: Seq[String],
                     places: Seq[Place],
                     entities: Seq[Entities]) extends Serializable
