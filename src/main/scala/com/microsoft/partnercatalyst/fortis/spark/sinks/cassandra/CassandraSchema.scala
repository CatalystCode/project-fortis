package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import com.microsoft.partnercatalyst.fortis.spark.dto.AnalyzedItem

// todo: update with real schema once defined on the cassandra db
case class CassandraRow(
  created_at: Long,
  pipeline: String)

object CassandraSchema {
  def apply(item: AnalyzedItem): CassandraRow = {
    CassandraRow(
      created_at = item.createdAtEpoch,
      pipeline = item.publisher
    )
  }
}
