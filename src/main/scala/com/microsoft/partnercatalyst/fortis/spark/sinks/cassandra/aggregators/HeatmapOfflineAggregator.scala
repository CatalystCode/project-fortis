package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators

import com.datastax.spark.connector._
import com.datastax.spark.connector.writer.SqlRowWriter
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.{CassandraHeatmapTiles, CassandraPopularPlaces, CassandraTileBucket}
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto.{ComputedTile, Event, HeatmapTile, PopularPlace}
import org.apache.spark.rdd.RDD
import org.apache.spark.sql.{DataFrame, SaveMode, SparkSession}

class HeatmapOfflineAggregator(session: SparkSession) extends OfflineAggregator[HeatmapTile] {
  private val ComputedTilesTable = "computedtiles"

  override def aggregate(events: RDD[Event]): RDD[HeatmapTile] = {
    val tiles = events.flatMap(event=>{
      Seq(
        event,
        event.copy(externalsourceid = "all"),
        event.copy(pipelinekey = "all", externalsourceid = "all")
      )
    }).flatMap(CassandraHeatmapTiles(_))
    tiles.keyBy(r=>{(
      r.heatmaptileid, r.period,
      r.periodtype, r.perioddate,
      r.conjunctiontopic1, r.conjunctiontopic2, r.conjunctiontopic3,
      r.tileid, r.tilez,
      r.pipelinekey, r.externalsourceid
    )}).reduceByKey((a,b)=>{
      val mentionCount = a.mentioncount + b.mentioncount
      val sentimentNumerator = a.avgsentimentnumerator + b.avgsentimentnumerator
      a.copy(
        mentioncount = mentionCount,
        avgsentimentnumerator = sentimentNumerator
      )
    }).values
  }

  private def aggregateTileBuckets(tiles: RDD[HeatmapTile], keyspace: String): DataFrame = {
    import session.implicits._
    val tilesComputed = tiles.keyBy(r=>{(
      r.period,
      r.periodtype, r.perioddate,
      r.conjunctiontopic1, r.conjunctiontopic2, r.conjunctiontopic3,
      r.tileid, r.tilez,
      r.pipelinekey, r.externalsourceid
    )}).reduceByKey((a,b)=>{
      val mentionCount = a.mentioncount + b.mentioncount
      val sentimentNumerator = a.avgsentimentnumerator + b.avgsentimentnumerator
      a.copy(
        mentioncount = mentionCount,
        avgsentimentnumerator = sentimentNumerator
      )
    }).values.map(CassandraTileBucket(_))

    val tileBucketDF = tilesComputed.toDF()

    tileBucketDF.createOrReplaceTempView("aggregatedtiles")

    val computedTilesSourceDF = session.read.format("org.apache.spark.sql.cassandra")
      .options(Map("keyspace" -> keyspace, "table" -> ComputedTilesTable))
      .load()

    computedTilesSourceDF.createOrReplaceTempView(ComputedTilesTable)

    val cassandraSave = session.sql(IncrementalUpdateQuery)

    cassandraSave
  }

  private def IncrementalUpdateQuery: String = {
    val GroupedBaseColumnNames = Seq("periodtype", "period", "conjunctiontopic1", "conjunctiontopic2", "conjunctiontopic3", "perioddate", "tileid", "tilez", "pipelinekey", "externalsourceid").mkString(",a.")

    s"SELECT a.$GroupedBaseColumnNames, " +
    s"       a.mentioncount + IF(IsNull(b.mentioncount), 0, b.mentioncount) as mentioncount, " +
    s"       a.avgsentimentnumerator + IF(IsNull(b.avgsentimentnumerator), 0, b.avgsentimentnumerator) as avgsentimentnumerator " +
    s"FROM   aggregatedtiles a " +
    s"LEFT OUTER JOIN ${ComputedTilesTable} b " +
    s" ON a.pipelinekey = b.pipelinekey and a.periodtype = b.periodtype and a.period = b.period " +
    s"    and a.externalsourceid = b.externalsourceid and a.conjunctiontopic1 = b.conjunctiontopic1 " +
    s"    and a.conjunctiontopic2 = b.conjunctiontopic2 and a.conjunctiontopic3 = b.conjunctiontopic3 " +
    s"    and a.tileid = b.tileid and a.tilez = b.tilez"
  }

  override def aggregateAndSave(events: RDD[Event], keyspace: String): Unit = {
    val tiles = aggregate(events).cache()
    tiles.count() match {
      case 0 => return
      case _ => {
        implicit val rowWriter = SqlRowWriter.Factory
        tiles.saveToCassandra(keyspace, "heatmap")

        val tileBuckets = aggregateTileBuckets(tiles, keyspace).cache()
        tileBuckets.write
          .format("org.apache.spark.sql.cassandra")
          .mode(SaveMode.Append)
          .options(Map("keyspace" -> keyspace, "table" -> ComputedTilesTable)).save
      }
    }
  }
}
