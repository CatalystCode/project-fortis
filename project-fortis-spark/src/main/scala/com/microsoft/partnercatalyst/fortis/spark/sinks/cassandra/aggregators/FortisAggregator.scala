package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators

import org.apache.spark.rdd.RDD
import org.apache.spark.sql.{DataFrame, Dataset, SparkSession}

trait FortisAggregator[T] {
 protected val KeyspaceName = "fortis"
 protected val CassandraFormat = "org.apache.spark.sql.cassandra"
 protected val AggregateFunctions = "sum(mentioncount) as mentioncountagg, SentimentWeightedAvg(IF(IsNull(avgsentiment), 0, avgsentiment), IF(IsNull(mentioncount), 0, mentioncount)) as avgsentimentagg"
 //protected val IncrementalUpdateMentionsUDF = "SumMentions(a.mentioncountagg, IF(IsNull(b.mentioncount), 0, b.mentioncount)) as mentioncount"
 //protected val IncrementalUpdateSentimentUDF = "MeanAverage(a.avgsentimentagg, a.mentioncountagg, IF(IsNull(b.avgsentiment), 0, b.avgsentiment), IF(IsNull(b.mentioncount), 0, b.mentioncount)) as avgsentiment"
 protected val IncrementalUpdateMentionsUDF = "a.mentioncountagg as mentioncount"
 protected val IncrementalUpdateSentimentUDF = "MeanAverage(a.avgsentimentagg, a.mentioncountagg) as avgsentimentnumerator"
 protected val DataFrameNameFlattenedEvents = "flattenedEventsDF"
 protected val DataFrameNameComputed = "computedDF"

 def aggregateAndSave(events: RDD[T], session:SparkSession): DataFrame
}