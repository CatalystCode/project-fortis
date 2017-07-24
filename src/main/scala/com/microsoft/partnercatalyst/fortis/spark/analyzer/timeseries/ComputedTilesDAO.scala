package com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries

import java.util.Date

import com.datastax.spark.connector._
import com.microsoft.partnercatalyst.fortis.spark.dto.ComputedTile
import org.apache.spark.SparkContext
import org.apache.spark.rdd.RDD
import org.apache.spark.sql.SparkSession

trait ComputedTilesDAOConfig extends Serializable {
  def retrospectivePeriodCountPerType(): Map[String, Int]
}

case class DefaultComputedTilesDAOConfig() extends ComputedTilesDAOConfig {
  override def retrospectivePeriodCountPerType(): Map[String, Int] = Map(
    (PeriodType.Minute.periodTypeName, 4*60), /* 4 hours */
    (PeriodType.Hour.periodTypeName, 7*24), /* 7 days */
    (PeriodType.Day.periodTypeName, 30), /* 4 weeks */
    (PeriodType.Week.periodTypeName, 6*4), /* 6 months */
    (PeriodType.Month.periodTypeName, 3*12), /* 3 years */
    (PeriodType.Year.periodTypeName, 7) /* 7 years */
  )
}

class ComputedTilesDAO(config: ComputedTilesDAOConfig = DefaultComputedTilesDAOConfig()) extends ComputedTilesSource {

  override def latestTiles(sc: SparkContext,
                           topics: Set[String],
                           periodType: PeriodType,
                           referenceTime: Long = new Date().getTime,
                           tilez: Seq[Int] = (8 to 16)): RDD[ComputedTile] = {
    val session = SparkSession.builder().appName(sc.appName).getOrCreate()
    val computedTilesTable = session.sparkContext.cassandraTable[ComputedTile]("fortis", "computedtiles")
    val topicTuples = topics.toSeq.map(TupleValue(_, null, null))
    val periods = this.retrospectivePeriods(periodType, referenceTime)
    computedTilesTable.select(
      "periodstartdate",
      "periodenddate",
      "periodtype",
      "pipelinekey",
      "period",
      "tilez",
      "tilex",
      "tiley",
      "externalsourceid",
      "mentioncount",
      "avgsentiment",
      "heatmap",
      "placeids",
      "insertion_time",
      "conjunctiontopics"
    ).where(
      "conjunctiontopics in ? and periodtype = ? and tilez in ? and period in ?",
      topicTuples, periodType.periodTypeName, tilez, periods
    )
  }

  private[timeseries] def retrospectivePeriods(periodType: PeriodType, referenceTime: Long): List[String] = {
    val periodCountPerType = config.retrospectivePeriodCountPerType()
    val periodWindowSize = periodCountPerType.getOrElse(periodType.periodTypeName, 7)
    val latestPeriod = periodType.truncateTimestamp(referenceTime)
    val startPeriod = latestPeriod - ((periodWindowSize - 1)* periodType.sizeInMilliseconds)
    periodType.periodsBetweenTimestamps(startPeriod, latestPeriod).toList
  }

}
