package com.microsoft.partnercatalyst.fortis.spark.dto

import java.util.Date

case class ComputedTrend(topic: String,
                         periodstartdate: Long,
                         periodtype: String,
                         period: String,
                         pipelinekey: String,
                         tilez: Int,
                         tilex: Int,
                         tiley: Int,
                         score: Double,
                         insertiontime: Long) extends Serializable {
  def this(tile: ComputedTile, score: Double) = this(
    tile.conjunctiontopics._1.get,
    tile.periodstartdate,
    tile.periodtype,
    tile.period,
    tile.pipelinekey,
    tile.tilez,
    tile.tilex,
    tile.tiley,
    score,
    new Date().getTime
  )
}