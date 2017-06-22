package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import com.microsoft.partnercatalyst.fortis.spark.dto.AnalyzedItem

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
