package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import com.microsoft.partnercatalyst.fortis.spark.FortisSettings
import org.apache.spark.SparkConf
import org.apache.spark.streaming.Duration

import scala.util.Properties.envOrElse

object CassandraConfig {
  private val CassandraUsername = "cassandra"
  private val CassandraPassword = "cassandra"//todo disable auth as we wont need it as C* will only be available internally in the cluster

  def init(conf: SparkConf, batchDuration: Duration, fortisSettings: FortisSettings): SparkConf = {
    conf.setIfMissing("spark.cassandra.connection.host", fortisSettings.cassandraHosts)
      .setIfMissing("spark.cassandra.auth.username", CassandraUsername)
      .setIfMissing("spark.cassandra.auth.password", CassandraPassword)
      .setIfMissing("spark.cassandra.connection.keep_alive_ms", envOrElse("CASSANDRA_KEEP_ALIVE_MS", (batchDuration.milliseconds * 2).toString))
      .setIfMissing("spark.cassandra.connection.factory", "com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.FortisConnectionFactory")
      .set("spark.cassandra.output.batch.size.bytes", "5120")
      .set("spark.cassandra.output.concurrent.writes", "16")
  }
}
