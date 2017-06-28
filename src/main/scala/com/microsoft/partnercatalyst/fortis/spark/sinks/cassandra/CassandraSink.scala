package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import com.datastax.spark.connector.streaming._
import com.microsoft.partnercatalyst.fortis.spark.dto.FortisEvent
import org.apache.spark.streaming.dstream.DStream

object CassandraSink {
  def apply(dstream: Option[DStream[FortisEvent]], keyspaceName: String, tableName: String): Unit = {
    if (dstream.isDefined) {
      dstream.get.map(CassandraSchema(_)).saveToCassandra(keyspaceName, tableName)
    }
  }
}
