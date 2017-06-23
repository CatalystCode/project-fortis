package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import com.microsoft.partnercatalyst.fortis.spark.dto.AnalyzedItem
import org.apache.spark.streaming.dstream.DStream
import com.datastax.spark.connector.streaming._

object CassandraSink {
  def apply(dstream: Option[DStream[AnalyzedItem]], keyspaceName: String, tableName: String): Unit = {
    if (dstream.isDefined) {
      dstream.get.map(CassandraSchema(_)).saveToCassandra(keyspaceName, tableName)
    }
  }
}
