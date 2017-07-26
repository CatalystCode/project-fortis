package com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries

import java.util.Date

import com.datastax.spark.connector._
import com.microsoft.partnercatalyst.fortis.spark.dto.ComputedTile
import org.apache.spark.SparkContext
import org.apache.spark.rdd.RDD
import org.apache.spark.sql.SparkSession

class ComputedTilesDAO(config: PeriodRetrospectiveConfig = DefaultPeriodRetrospectiveConfig()) extends ComputedTilesSource {

  override def latestTiles(sc: SparkContext,
                           topics: (Option[String], Option[String], Option[String]),
                           periodType: PeriodType,
                           referenceTime: Long = new Date().getTime,
                           tilez: Int): RDD[ComputedTile] = {
    val session = SparkSession.builder().appName(sc.appName).getOrCreate()
    val computedTilesTable = session.sparkContext.cassandraTable[ComputedTile]("fortis", "computedtiles")
    val periods = periodType.retrospectivePeriods(referenceTime)
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
      "conjunctiontopics = ? and periodtype = ? and tilez = ? and period in ?",
      topics, periodType.periodTypeName, tilez, periods
    )
  }

}
