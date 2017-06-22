package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import java.lang.System.getenv

import org.apache.spark.SparkConf
import org.apache.spark.streaming.Duration

object CassandraConfig {
  def init(conf: SparkConf, batchDuration: Duration): SparkConf = {
    conf.setIfMissing("spark.cassandra.connection.host", getenv("FORTIS_CASSANDRA_HOST"))
        .setIfMissing("spark.cassandra.auth.username", getenv("FORTIS_CASSANDRA_USER"))
        .setIfMissing("spark.cassandra.auth.password", getenv("FORTIS_CASSANDRA_PASSWORD"))
        .setIfMissing("spark.cassandra.connection.keep_alive_ms", (batchDuration.milliseconds * 2).toString)
  }
}
