package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto

case class Event(
  pipelinekey: String,
  computedfeatures_json: String,
  eventtime: Long,
  eventlangcode: String,
  eventid: String,
  sourceeventid: String,
  insertiontime: Long,
  body: String,
  summary: String,
  imageurl: Option[String],
  batchid: String,
  externalsourceid: String,
  sourceurl: String,
  title: String
) extends Serializable

case class EventBatchEntry(
  eventid: String,
  pipelinekey: String
) extends Serializable

case class TileRow(
  externalsourceid: String,
  perioddate: Long,
  periodtype: String,
  pipelinekey: String,
  mentioncount: Long,
  avgsentimentnumerator: Long,
  tilez: Int,
  tileid: String,
  heatmaptileid: String,
  centroidlat: Double,
  centroidlon: Double,
  conjunctiontopic1: String,
  conjunctiontopic2: String,
  conjunctiontopic3: String,
  eventtime: Long,
  placeid: String,
  eventid: String,
  insertiontime: Long
) extends Serializable


case class ConjunctiveTopic(
  eventid: String,
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
