package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators

import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto.{AggregationRecord, Event, EventBatchEntry}
import org.apache.spark.sql.{DataFrame, Dataset, SparkSession}

trait FortisAggregator {
 protected val KeyspaceName = "fortis"
 protected val CassandraFormat = "org.apache.spark.sql.cassandra"
 protected val AggregateFunctions = "sum(mentioncount) as mentioncountagg, SentimentWeightedAvg(IF(IsNull(avgsentiment), 0, avgsentiment), IF(IsNull(mentioncount), 0, mentioncount)) as avgsentimentagg"
 //protected val IncrementalUpdateMentionsUDF = "SumMentions(a.mentioncountagg, IF(IsNull(b.mentioncount), 0, b.mentioncount)) as mentioncount"
 //protected val IncrementalUpdateSentimentUDF = "MeanAverage(a.avgsentimentagg, a.mentioncountagg, IF(IsNull(b.avgsentiment), 0, b.avgsentiment), IF(IsNull(b.mentioncount), 0, b.mentioncount)) as avgsentiment"
 protected val IncrementalUpdateMentionsUDF = "a.mentioncountagg as mentioncount"
 protected val IncrementalUpdateSentimentUDF = "MeanAverage(a.avgsentimentagg, a.mentioncountagg) as avgsentimentnumerator"
 protected val DataFrameNameFlattenedEvents = "flattenedEventsDF"
 protected val DataFrameNameComputed = "computedDF"

 def FortisTargetTablename: String
 def DfTableNameFlattenedEvents: String
 def DfTableNameComputedAggregates: String

 def FortisTargetTableDataFrame(session:SparkSession): DataFrame
 def flattenEvents(session: SparkSession, eventDS: Dataset[Event]): DataFrame
 def IncrementalUpdate(session:SparkSession, aggregatedDS: DataFrame): DataFrame
 def AggregateEventBatches(session: SparkSession, flattenedEvents: DataFrame): DataFrame
}

abstract class FortisAggregatorBase extends FortisAggregator {
  override def DfTableNameFlattenedEvents: String = s"$DataFrameNameFlattenedEvents$FortisTargetTablename"

  override def DfTableNameComputedAggregates: String = s"$DataFrameNameComputed$FortisTargetTablename"
}