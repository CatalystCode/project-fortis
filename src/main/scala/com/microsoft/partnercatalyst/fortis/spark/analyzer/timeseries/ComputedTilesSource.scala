package com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries

import java.util.Date

import com.microsoft.partnercatalyst.fortis.spark.dto.ComputedTile
import org.apache.spark.SparkContext
import org.apache.spark.rdd.RDD

trait ComputedTilesSource extends Serializable {
  def latestTiles(sc: SparkContext,
                  topics: Set[(Option[String], Option[String], Option[String])],
                  periodType: PeriodType,
                  referenceTime: Long = new Date().getTime,
                  tilez: Seq[Int] = (1 to 16)): RDD[ComputedTile]
}
