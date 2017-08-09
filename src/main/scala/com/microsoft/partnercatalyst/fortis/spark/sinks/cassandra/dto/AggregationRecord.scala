package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto

trait AggregationRecord {
  val periodstartdate: Long
  val periodenddate: Long
  val periodtype: String
  val period: String
  val pipelinekey: String
  val mentioncount: Long
  val avgsentiment: Double
  val avgsentimentnumerator: Long
  val externalsourceid: String
}

trait AggregationRecordTile extends AggregationRecord {
  val tilex: Int
  val tiley: Int
  val tilez: Int
}