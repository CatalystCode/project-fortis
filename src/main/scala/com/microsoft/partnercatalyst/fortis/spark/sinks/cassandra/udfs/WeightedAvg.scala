package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.udfs

import org.apache.spark.sql.{Row}
import org.apache.spark.sql.expressions.{Aggregator, MutableAggregationBuffer, UserDefinedAggregateFunction}
import org.apache.spark.sql.types._

case class Average(var sum: Double, var count: BigInt)

abstract class WeightedAvg extends UserDefinedAggregateFunction {
  override def inputSchema: StructType = StructType(StructField("avgsentiment", DoubleType) :: StructField("mentioncount", LongType) :: Nil)
  override def bufferSchema: StructType = {
    StructType(StructField("sum", DoubleType) :: StructField("count", LongType) :: Nil)
  }

  override def dataType: DataType = DoubleType

  override def deterministic: Boolean = true

  override def initialize(buffer: MutableAggregationBuffer): Unit = {
    buffer(0) = 0D
    buffer(1) = 0L
  }

  override def update(buffer: MutableAggregationBuffer, input: Row)

  override def merge(buffer1: MutableAggregationBuffer, buffer2: Row)

  // Calculates the final result
  override def evaluate(buffer: Row): Double

  def getDoubleValue(dblValue: Option[Double]): Double = {
    dblValue match {
      case None => 0
      case Some(number) => number
    }
  }

  def getLongValue(longValue: Option[Long]): Long = {
    longValue match {
      case None => 0
      case Some(number) => number
    }
  }
}

object SentimentWeightedAvg extends WeightedAvg with Serializable{
  override def update(buffer: MutableAggregationBuffer, input: Row): Unit = {
    val sentiment = getDoubleValue(Option(input.getDouble(0)))
    val count = getLongValue(Option(input.getLong(1)))
    val currentSentiment = buffer.getDouble(0)
    val currentCount = buffer.getLong(1)

    buffer.update(0, currentSentiment + (sentiment * count.toDouble))
    buffer.update(1, currentCount + count)
  }

  override def evaluate(buffer: Row): Double = {
    getDoubleValue(Option(buffer.getDouble(0))) / getLongValue(Option(buffer.getLong(1))).toDouble
  }

  override def merge(buffer1: MutableAggregationBuffer, buffer2: Row): Unit = {
    val sentiment = getDoubleValue(Option(buffer2.getDouble(0)))
    val count = getLongValue(Option(buffer2.getLong(1)))
    val currentSentiment = getDoubleValue(Option(buffer1.getDouble(0)))
    val currentCount = getLongValue(Option(buffer1.getLong(1)))

    buffer1.update(0, currentSentiment + sentiment)
    buffer1.update(1, currentCount + count)
  }
}