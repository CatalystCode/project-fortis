package com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries

import com.microsoft.partnercatalyst.fortis.spark.dto.{ComputedTile, ComputedTrend}
import org.apache.commons.math3.stat.regression.SimpleRegression
import org.apache.spark.rdd.RDD

object ComputedTilesToComputedTrends {

  def apply(computedTiles: RDD[ComputedTile]): RDD[ComputedTrend] = {
    val groupedTiles = computedTiles.groupBy(tileGroup)
    groupedTiles.flatMap[ComputedTrend]((group) => {
      val tiles = group._2.toSeq

      val regressionResult = linearRegression(tiles)

      val score = regressionResult.getSlope
      if (score.isNaN) Seq[ComputedTrend]()
      else {
        val latestTile = tiles.sortBy(t => -t.periodstartdate).head
        val filteredTiles = tiles.filter(t => t.period == latestTile.period)
        val trends = filteredTiles.map(new ComputedTrend(_, score))
        trends
      }
    })
  }

  def tileGroup(computedTile: ComputedTile): String = {
    (
      computedTile.pipelinekey,
      computedTile.conjunctiontopics.toString,
      computedTile.tilez.toString
    ).toString()
  }

  def linearRegression(computedTiles: Seq[ComputedTile]): SimpleRegression = {
    computedTiles.par.aggregate(new SimpleRegression(true))((regression, tile)=>{
      regression.addData(tile.periodstartdate, tile.mentioncount)
      regression
    }, (regression1,regression2)=>{
      regression1.append(regression2)
      regression1
    })
  }

}
