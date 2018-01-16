package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import java.lang.System.currentTimeMillis
import java.util.UUID

import com.datastax.spark.connector._
import com.datastax.spark.connector.cql.CassandraConnector
import com.datastax.spark.connector.writer.WriteConf
import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.dto.FortisEvent
import com.microsoft.partnercatalyst.fortis.spark.logging.{FortisTelemetry, Loggable}
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators._
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto._
import org.apache.spark.SparkContext
import org.apache.spark.rdd.RDD
import org.apache.spark.sql.SparkSession
import org.apache.spark.streaming.Time
import org.apache.spark.streaming.dstream.DStream

import scala.util.{Failure, Success, Try}

object CassandraEventsSink extends Loggable {
  private val KeyspaceName = "fortis"
  private val TableEvent = "events"
  private val TableEventPlaces = "eventplaces"
  private val TableEventBatches = "eventbatches"

  def apply(dstream: DStream[FortisEvent], sparkSession: SparkSession, configurationManager: ConfigurationManager): Unit = {
    implicit lazy val connector: CassandraConnector = CassandraConnector(sparkSession.sparkContext)

    dstream
    .map(event => event.copy(analysis = event.analysis.copy(
      keywords = event.analysis.keywords.distinct,
      locations = event.analysis.locations.distinct,
      entities = event.analysis.entities.distinct
    )))
    .foreachRDD { (eventsRDD, _: Time) => {
        eventsRDD.cache()

        if (!eventsRDD.isEmpty) {
          val batchid = UUID.randomUUID().toString
          val fortisEventsRDD = eventsRDD.map(CassandraEventSchema(_, batchid))

          val fortisEventsRDDRepartitioned = repartition(sparkSession, fortisEventsRDD)

          writeFortisEvents(fortisEventsRDDRepartitioned)

          val offlineAggregators = Seq[OfflineAggregator[_]](
            new ConjunctiveTopicsOffineAggregator(configurationManager),
            new PopularPlacesOfflineAggregator(configurationManager),
            new HeatmapOfflineAggregator(configurationManager)
          )

          val filteredEvents = removeDuplicates(batchid, fortisEventsRDDRepartitioned)

          writeEventBatchToEventTagTables(filteredEvents, sparkSession.sparkContext)

          val eventsExploded = filteredEvents.flatMap(event=>{
            Seq(
              event,
              event.copy(externalsourceid = "all"),
              event.copy(pipelinekey = "all", externalsourceid = "all")
            )
          })

          offlineAggregators.foreach(aggregator => writeAggregates(eventsExploded, aggregator))

          eventsExploded.unpersist(blocking = true)
          filteredEvents.unpersist(blocking = true)
          fortisEventsRDDRepartitioned.unpersist(blocking = true)
          fortisEventsRDD.unpersist(blocking = true)
          eventsRDD.unpersist(blocking = true)
        }
      }
    }

    def writeFortisEvents(events: RDD[Event]): Unit = {
      val startTime = currentTimeMillis()
      val success = Try(events.saveToCassandra(KeyspaceName, TableEvent, writeConf = WriteConf(ifNotExists = true))).isSuccess
      FortisTelemetry.get.logDependency("sinks.cassandra", s"write.$TableEvent", success, currentTimeMillis() - startTime)
    }

    def removeDuplicates(batchid: String, events: RDD[Event]): RDD[Event] = {
      val repartitionStartTime = currentTimeMillis()
      val repartitionSuccess = Try(events.repartitionByCassandraReplica(KeyspaceName, TableEventBatches)).isSuccess
      val repartitionEndTime = currentTimeMillis()
      FortisTelemetry.get.logDependency("sinks.cassandra", s"repartition.$TableEventBatches", repartitionSuccess, repartitionEndTime - repartitionStartTime)

      val joinStartTime = currentTimeMillis()
      Try(events.joinWithCassandraTable(
        KeyspaceName,
        TableEventBatches,
        selectedColumns = SomeColumns("eventid", "batchid"),
        joinColumns = SomeColumns("eventid", "batchid")
      ).map(_._1).cache()) match {
        case Success(joined) =>
          FortisTelemetry.get.logDependency("sinks.cassandra", s"join.$TableEventBatches", success = true, currentTimeMillis() - joinStartTime)
          joined
        case Failure(ex) =>
          FortisTelemetry.get.logDependency("sinks.cassandra", s"join.$TableEventBatches", success = false, currentTimeMillis() - joinStartTime)
          throw ex
      }
    }

    def writeEventBatchToEventTagTables(events: RDD[Event], sparkContext: SparkContext): Unit = {
      val defaultZoom = configurationManager.fetchSiteSettings(sparkContext).defaultzoom

      val eventsWithSchema = events.flatMap(CassandraEventPlacesSchema(_, defaultZoom))
      val startTime = currentTimeMillis()
      val success = Try(eventsWithSchema.saveToCassandra(KeyspaceName, TableEventPlaces)).isSuccess
      FortisTelemetry.get.logDependency("sinks.cassandra", s"write.$TableEventPlaces", success, currentTimeMillis() - startTime)
    }

    def repartition(sparkSession: SparkSession, fortisEventsRDD: RDD[Event]) = {
      val startTime = currentTimeMillis()
      Try(fortisEventsRDD.repartition(2 * sparkSession.sparkContext.defaultParallelism).cache()) match {
        case Success(fortisEventsRDDRepartitioned) =>
          FortisTelemetry.get.logDependency("sinks.cassandra", s"spark.repartition", success = true, currentTimeMillis() - startTime)
          fortisEventsRDDRepartitioned
        case Failure(ex) =>
          FortisTelemetry.get.logDependency("sinks.cassandra", s"spark.repartition", success = false, currentTimeMillis() - startTime)
          throw ex
      }
    }

    def writeAggregates(eventsExploded: RDD[Event], aggregator: OfflineAggregator[_]): Unit = {
      val aggregatorName = aggregator.getClass.getSimpleName
      val startTime = currentTimeMillis()
      Try(aggregator.aggregateAndSave(eventsExploded, KeyspaceName)) match {
        case Success(_) =>
          FortisTelemetry.get.logDependency("sinks.cassandra", s"aggregateAndSave.$aggregatorName", success = true, currentTimeMillis() - startTime)
        case Failure(e) =>
          FortisTelemetry.get.logDependency("sinks.cassandra", s"aggregateAndSave.$aggregatorName", success = false, currentTimeMillis() - startTime)
          logError(s"Failed performing offline aggregation $aggregatorName", e)
      }
    }
  }
}