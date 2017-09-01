package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators

import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto.Event
import org.apache.spark.rdd.RDD

trait OfflineAggregator[T] extends Serializable {

  def aggregate(events: RDD[Event]): RDD[T]
  def aggregateAndSave(events: RDD[Event], keyspace: String)

}
