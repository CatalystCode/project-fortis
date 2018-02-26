package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators

import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto.{Event, TileRow}
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.{PeriodType, TileRows}
import org.apache.spark.rdd.RDD
import com.datastax.spark.connector._
import com.microsoft.partnercatalyst.fortis.spark.logging.{FortisTelemetry, Timer}
import FortisTelemetry.{get => Log}
import com.datastax.spark.connector.cql.CassandraConnector
import com.datastax.spark.connector.writer.RowWriterFactory
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.Constants._
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.CassandraExtensions._

import scala.reflect.ClassTag

class TileAggregator(configurationManager: ConfigurationManager) extends (RDD[Event] => Unit) {
  val LogName = "sinks.cassandra.write"

  override def apply(events: RDD[Event]): Unit = {
    val defaultZoom = configurationManager.fetchSiteSettings(events.sparkContext).defaultzoom

    // Partition tile rows by partition key of heatmap table which is shared by most other tile aggregation tables
    // as well. This way, the results of all aggregations below will land on the same Cassandra nodes the they were
    // computed on in Spark.
    val tileRows = toTileRows(events, defaultZoom).repartitionByCassandraReplica(KeyspaceName, Table.HeatMap)
      .keyBy(_.eventid).cache()

    Timer.time(Log.logDependency(LogName, Table.HeatMap, _, _)) {
      tileRows.values.saveToCassandra(KeyspaceName, Table.HeatMap)
    }

    Timer.time(Log.logDependency(LogName, s"${Table.EventPlaces},${Table.EventPlacesByPipeline},${Table.EventPlacesBySource}", _, _)) {
      val eventPlaces = toEventPlaces(tileRows.values).cache()
      eventPlaces.saveToCassandra(KeyspaceName, Table.EventPlacesBySource)
      eventPlaces.saveToCassandra(KeyspaceName, Table.EventPlaces)
      eventPlaces.saveToCassandra(KeyspaceName, Table.EventPlacesByPipeline)
    }

    deDupAndSaveToCassandra(tileRows, Table.PopularPlaces)
    deDupAndSaveToCassandra(tileRows, Table.ComputedTiles)
    deDupAndSaveToCassandra(tileRows, Table.PopularSources)
    deDupAndSaveToCassandra(toPopularTopics(tileRows), Table.PopularTopics)

    tileRows.unpersist(blocking = true)
  }

  private[aggregators] def toTileRows(events: RDD[Event], defaultZoom: Int): RDD[TileRow] = {
    TileRows(events, defaultZoom)
  }

  private[aggregators] def toEventPlaces(tiles: RDD[TileRow]): RDD[TileRow] = {
    tiles.filter(tile =>
      // de-dup since event places are period-agnostic
      tile.periodtype == PeriodType.Day.periodTypeName

        // Remove "all" category events
        && tile.externalsourceid != "all"
        && tile.pipelinekey != "all"
    )
  }

  private[aggregators] def toPopularTopics(tiles: RDD[(String, TileRow)]): RDD[(String, TileRow)] = {
    tiles.filter { case (_, tile) => tile.conjunctiontopic2 == "" && tile.conjunctiontopic3 == "" }
  }

  private def deDupAndSaveToCassandra[K, V](rows: RDD[(K, V)], tableName: String)
    (implicit connector: CassandraConnector = CassandraConnector(rows.sparkContext), rwf: RowWriterFactory[V],
     kt: ClassTag[K], vt: ClassTag[V], ord: Ordering[K]): Unit =
  {
    val rowsUniqueByEvent = rows.deDupValuesByCassandraTable(KeyspaceName, tableName).values

    Timer.time(Log.logDependency(LogName, tableName, _, _)) {
      rowsUniqueByEvent.saveToCassandra(KeyspaceName, tableName)
    }
  }
}