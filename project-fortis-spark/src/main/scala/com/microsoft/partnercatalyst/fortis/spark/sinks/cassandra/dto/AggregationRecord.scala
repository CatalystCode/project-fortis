package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto

trait AggregationRecord {
  val perioddate: Long
  val periodtype: String
  val pipelinekey: String
  val mentioncount: Long
  val avgsentimentnumerator: Long
  val externalsourceid: String
}

trait AggregationRecordTile extends AggregationRecord {
  val tileid: String
  val tilez: Int
}