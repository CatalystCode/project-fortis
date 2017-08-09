package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.udfs

object FortisUdfFunctions {
  private val FloatToLongConversionFactor = 1000
/*  val MeanAverage = (aggregationMean: Float, aggregationCount: Long, currentMean: Float, currentCount: Long) => {
    val totalCount = getLong(aggregationCount, Option(0L)) + getLong(currentCount)

    totalCount match {
      case 0 => 0
      case _ => (getFloat(aggregationMean) * getLong(aggregationCount, Option(0L))) + (getFloat(currentMean) * getLong(currentCount)) / totalCount
    }
  }*/

  val MeanAverage: (Float, Long) => Long = (aggregationMean: Float, aggregationCount: Long) => {
    ((getFloat(aggregationMean) * getLong(aggregationCount, Option(0L))) * FloatToLongConversionFactor).toLong
  }

  val OptionalSummation = (longArgs1: Long, longArgs2: Long) => getLong(longArgs1, Option(0L)) + getLong(longArgs2, Option(0L))

  private def getLong(number: Long, defaultValue: Option[Long] = None): Long ={
    Option(number) match {
      case None => defaultValue.getOrElse(1)
      case Some(num) => number
    }
  }

  private def getOptionalLong(number: Option[Long], defaultValue: Option[Long] = None): Long ={
    Option(number) match {
      case None => defaultValue.getOrElse(1)
      case Some(num) => num.get
    }
  }

  private def getFloat(number: Float, defaultValue: Option[Float] = None): Float ={
    Option(number) match {
      case None => defaultValue.getOrElse(1)
      case Some(num) => num
    }
  }

  private def getFloatOptional(number: Option[Float], defaultValue: Option[Float] = None): Float ={
    Option(number) match {
      case None => defaultValue.getOrElse(1)
      case Some(num) => num.get
    }
  }
}
