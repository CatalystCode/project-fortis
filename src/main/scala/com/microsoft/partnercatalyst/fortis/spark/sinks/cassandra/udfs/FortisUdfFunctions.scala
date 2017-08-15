package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.udfs

import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto.HeatmapEntry
import net.liftweb.json.{parse}
import net.liftweb.json.Extraction.decompose
import net.liftweb.json.DefaultFormats
import net.liftweb.json.JsonAST.{JValue, RenderSettings, render}
import org.apache.spark.sql.catalyst.expressions.GenericRowWithSchema

object FortisUdfFunctions {
  private val DoubleToLongConversionFactor = 1000

  val MeanAverage: (Double, Long) => Long = (aggregationMean: Double, aggregationCount: Long) => {
    ((getDouble(aggregationMean) * getLong(aggregationCount, 0L)) * DoubleToLongConversionFactor).toLong
  }

  val MergeHeatMap: (Seq[GenericRowWithSchema], String) => String = (heatmapCollectionSeq: Seq[GenericRowWithSchema], originalHeatmapStr: String) => {
    val tileIdField = "detailtileid"
    val avgSentimentField = "avgsentimentagg"
    val mentionCountField = "mentioncountagg"

    def getSentimentAvg(heatmapEntry: Option[HeatmapEntry]) = heatmapEntry match {
      case None => 0D
      case Some(hm) => hm.avgsentimentagg
    }

    def getMentionCount(heatmapEntry: Option[HeatmapEntry]) = heatmapEntry match {
      case None => 0L
      case Some(hm) => hm.mentioncountagg
    }

    implicit val formats = DefaultFormats
    val originalHeatmap = parse(originalHeatmapStr).extract[Map[String, HeatmapEntry]]

    val aggregatedHeatmap = heatmapCollectionSeq.map(tile => tile.getAs[String](tileIdField) ->
      HeatmapEntry(
        avgsentimentagg = tile.getAs[Double](avgSentimentField),
        mentioncountagg = tile.getAs[Long](mentionCountField)
      )).toMap

    val mergedMap = originalHeatmap ++ aggregatedHeatmap.map{case(tileId, entry) => tileId -> HeatmapEntry(
      avgsentimentagg = MeanAverage(getSentimentAvg(originalHeatmap.get(tileId)), getMentionCount(originalHeatmap.get(tileId))) + MeanAverage(Option(entry.avgsentimentagg).getOrElse(0D), Option(entry.mentioncountagg).getOrElse(0L)),
      mentioncountagg = getMentionCount(originalHeatmap.get(tileId)) + Option(entry.mentioncountagg).getOrElse(0L)
    )}

    compactRender(decompose(mergedMap))
  }

  val OptionalSummation = (longArgs1: Long, longArgs2: Long) => getLong(longArgs1, 0L) + getLong(longArgs2, 0L)

  private def getLong(number: Long, defaultValue: Long = 1L): Long ={
    Option(number) match {
      case None => defaultValue
      case Some(num) => number
    }
  }

  private def compactRender(value: JValue): String = {
    render(value, RenderSettings.compact)
  }

  private def getDouble(number: Double, defaultValue: Double = 1D): Double ={
    Option(number) match {
      case None => defaultValue
      case Some(num) => num
    }
  }
}