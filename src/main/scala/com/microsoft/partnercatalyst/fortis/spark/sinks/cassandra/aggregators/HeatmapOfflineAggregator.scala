package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators

import com.datastax.spark.connector.writer.SqlRowWriter
import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto.{Event, HeatmapTile}
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.{CassandraHeatmapTiles, CassandraTileBucket}
import org.apache.spark.rdd.RDD
import org.apache.spark.sql.SparkSession

import com.datastax.spark.connector._

class HeatmapOfflineAggregator(session: SparkSession, configurationManager: ConfigurationManager) extends OfflineAggregator[HeatmapTile] {
  override def aggregate(events: RDD[Event]): RDD[HeatmapTile] = {
    val siteSettings = configurationManager.fetchSiteSettings(events.sparkContext)
    val tiles = events.flatMap(CassandraHeatmapTiles(_, siteSettings.defaultzoom))

    tiles.keyBy(r=>{(
      r.periodtype, r.perioddate,
      r.conjunctiontopic1, r.conjunctiontopic2, r.conjunctiontopic3,
      r.tileid, r.tilez,
      r.pipelinekey, r.externalsourceid, r.heatmaptileid
    )}).reduceByKey((a,b)=>{
      val mentionCount = a.mentioncount + b.mentioncount
      val sentimentNumerator = a.avgsentimentnumerator + b.avgsentimentnumerator
      a.copy(
        mentioncount = mentionCount,
        avgsentimentnumerator = sentimentNumerator
      )
    }).values
  }

  private def aggregateAndSaveTileBuckets(tiles: RDD[HeatmapTile], keyspace: String): Unit = {
    val tilesComputed = tiles.keyBy(r => {
      (
        r.periodtype, r.perioddate,
        r.conjunctiontopic1, r.conjunctiontopic2, r.conjunctiontopic3,
        r.tileid, r.tilez,
        r.pipelinekey, r.externalsourceid
      )
    }).reduceByKey((a, b) => {
      val mentionCount = a.mentioncount + b.mentioncount
      val sentimentNumerator = a.avgsentimentnumerator + b.avgsentimentnumerator
      a.copy(
        mentioncount = mentionCount,
        avgsentimentnumerator = sentimentNumerator
      )
    }).values.map(CassandraTileBucket(_))

    val reparted = tilesComputed.repartitionByCassandraReplica("fortis", "computedtiles")

    val updatedRows = reparted.leftJoinWithCassandraTable("fortis", "computedtiles").map(pair => {
      val generatedTile = pair._1
      val tileFromCassandra = pair._2
      tileFromCassandra match {
        case None => generatedTile
        case Some(cassandraTile) => generatedTile.copy(
          mentioncount = generatedTile.mentioncount + cassandraTile.getLong("mentioncount"),
          avgsentimentnumerator = generatedTile.avgsentimentnumerator + cassandraTile.getLong("avgsentimentnumerator")
        )
      }
    })

    updatedRows.saveToCassandra("fortis", "computedtiles")

    updatedRows.unpersist(blocking = true)
    reparted.unpersist(blocking = true)
  }

  override def aggregateAndSave(events: RDD[Event], keyspace: String): Unit = {
    val tiles = aggregate(events).cache()
    tiles.count() match {
      case 0 => return
      case _ => {
        implicit val rowWriter = SqlRowWriter.Factory
        tiles.saveToCassandra(keyspace, "heatmap")
        aggregateAndSaveTileBuckets(tiles, keyspace)
      }
    }

    tiles.unpersist(blocking = true)
  }
}
