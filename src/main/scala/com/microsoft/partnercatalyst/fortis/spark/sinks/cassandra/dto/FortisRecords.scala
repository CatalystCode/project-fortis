package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto

case class Event(
  pipelinekey: String,
  computedfeatures: Features,
  eventtime: Long,
  eventlangcode: String,
  eventid: String,
  sourceeventid: String,
  insertiontime: Long,
  body: String,
  summary: String,
  fulltext: String,
  batchid: String,
  externalsourceid: String,
  topics: Seq[String],
  placeids: Seq[String],
  sourceurl: String,
  title: String
) extends Serializable

case class EventBatchEntry(
  eventid: String,
  pipelinekey: String
) extends Serializable

case class EventTopics(
  pipelinekey: String,
  insertiontime: Long,
  eventid: String,
  externalsourceid: String,
  eventtime: Long,
  topic: String
) extends Serializable

case class EventPlaces(
  pipelinekey: String,
  insertiontime: Long,
  eventid: String,
  centroidlat: Double,
  centroidlon: Double,
  tileid: String,
  tilez: Int,
  conjunctiontopic1: String,
  conjunctiontopic2: String,
  conjunctiontopic3: String,
  externalsourceid: String,
  eventtime: Long,
  placeid: String
) extends Serializable

case class PopularPlace(
  avgsentimentnumerator: Long,
  conjunctiontopic1: String,
  conjunctiontopic2: String,
  conjunctiontopic3: String,
  externalsourceid: String,
  mentioncount: Long,
  tileid: String,
  tilez: Int,
  perioddate: Long,
  periodtype: String,
  pipelinekey: String,
  placeid: String = ""
) extends Serializable

case class HeatmapTile(
                         override val externalsourceid: String,
                         override val perioddate: Long,
                         override val periodtype: String,
                         override val period: String,
                         override val pipelinekey: String,
                         override val mentioncount: Long,
                         override val avgsentimentnumerator: Long,
                         override val tilez: Int,
                         override val tileid: String,
                         heatmaptileid: String,
                         conjunctiontopic1: String,
                         conjunctiontopic2: String,
                         conjunctiontopic3: String
) extends AggregationRecordTile with Serializable

case class ComputedTile(
                        override val externalsourceid: String,
                        override val perioddate: Long,
                        override val periodtype: String,
                        override val period: String,
                        override val pipelinekey: String,
                        override val mentioncount: Long,
                        override val avgsentimentnumerator: Long,
                        override val tilez: Int,
                        override val tileid: String,
                        conjunctiontopic1: String,
                        conjunctiontopic2: String,
                        conjunctiontopic3: String
                      ) extends AggregationRecordTile with Serializable

case class HeatmapEntry (
  mentioncountagg: Long,
  avgsentimentagg: Double
)

case class PopularTopicAggregate(
  override val perioddate: Long,
  override val externalsourceid: String,
  override val periodtype: String,
  override val period: String,
  override val pipelinekey: String,
  override val mentioncount: Long,
  override val avgsentimentnumerator: Long,
  override val tileid: String,
  override val tilez: Int,
  topic: String
) extends AggregationRecordTile with Serializable

case class ConjunctiveTopic(
  conjunctivetopic: String,
  externalsourceid: String,
  mentioncount: Long,
  perioddate: Long,
  periodtype: String,
  pipelinekey: String,
  tileid: String,
  tilez: Int,
  topic: String
) extends Serializable

case class SiteSetting(
  sitename: String,
  geofence: Seq[Double],
  languages: Set[String],
  defaultzoom: Int,
  title: String,
  logo: String,
  translationsvctoken: String,
  cogspeechsvctoken: String,
  cogvisionsvctoken: String,
  cogtextsvctoken: String,
  insertiontime: Long
)

case class Stream(
  pipeline: String,
  streamid: Long,
  connector: String,
  params: Map[String, String]
)

case class TrustedSource(
  sourceid: String,
  sourcetype: String,
  connector: String,
  rank: Int,
  insertion_time: Long
)
