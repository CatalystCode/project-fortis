package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import java.util.UUID

import com.datastax.driver.core.ConsistencyLevel
import com.datastax.spark.connector._
import com.datastax.spark.connector.cql.CassandraConnector
import com.datastax.spark.connector.writer.WriteConf
import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.dto.FortisEvent
import com.microsoft.partnercatalyst.fortis.spark.logging.Timer
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators._
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto._
import org.apache.spark.SparkContext
import org.apache.spark.rdd.RDD
import org.apache.spark.sql.SparkSession
import org.apache.spark.streaming.dstream.DStream

import scala.util.{Failure, Success, Try}
import com.microsoft.partnercatalyst.fortis.spark.logging.FortisTelemetry.{get => Log}

object CassandraEventsSink {
  private val KeyspaceName = "fortis"
  private val TableEvent = "events"
  private val TableEventPlaces = "eventplaces"
  private val TableEventBatches = "eventbatches"

  def apply(stream: DStream[FortisEvent], sparkSession: SparkSession, configurationManager: ConfigurationManager): Unit = {
    implicit lazy val connector: CassandraConnector = CassandraConnector(sparkSession.sparkContext)

    val aggregators = Seq[OfflineAggregator[_]](
      new ConjunctiveTopicsOffineAggregator(configurationManager),
      new PopularPlacesOfflineAggregator(configurationManager),
      new HeatmapOfflineAggregator(configurationManager)
    )

    stream.map(event => event.copy(analysis = event.analysis.copy(
      keywords = event.analysis.keywords.distinct,
      locations = event.analysis.locations.distinct,
      entities = event.analysis.entities.distinct
    )))
    .foreachRDD { eventsRDD => {
        eventsRDD.cache()

        if (!eventsRDD.isEmpty) {
          val batchId = UUID.randomUUID().toString
          val fortisEventsRDD = eventsRDD.map(CassandraEventSchema(_, batchId))
          val fortisEventsRDDRepartitioned = repartitioned(sparkSession, fortisEventsRDD)

          // Write events
          writeFortisEvents(fortisEventsRDDRepartitioned)

          // Get events unique to this batch
          val uniqueEvents = withoutDuplicates(fortisEventsRDDRepartitioned)

          // Write event places
          writeEventPlaces(uniqueEvents, sparkSession.sparkContext)

          // Add 2 additional copies of each event to support aggregation by "all" pipelines and sources
          val eventsExploded = uniqueEvents.flatMap(event=>{
            Seq(
              event,
              event.copy(externalsourceid = "all"),
              event.copy(pipelinekey = "all", externalsourceid = "all")
            )
          })

          // Perform aggregations and write results
          aggregators.foreach(aggregator => writeAggregates(eventsExploded, aggregator))

          eventsExploded.unpersist(blocking = true)
          uniqueEvents.unpersist(blocking = true)
          fortisEventsRDDRepartitioned.unpersist(blocking = true)
          fortisEventsRDD.unpersist(blocking = true)
          eventsRDD.unpersist(blocking = true)
        }
      }
    }

    def writeFortisEvents(events: RDD[Event]): Unit = {
      val conf = WriteConf.fromSparkConf(events.sparkContext.getConf).copy(
        ifNotExists = true,
        consistencyLevel = ConsistencyLevel.ALL // Ensure write is consistent across all replicas
      )

      Timer.time(Log.logDependency("sinks.cassandra", s"write.$TableEvent", _, _)) {
        events.saveToCassandra(KeyspaceName, TableEvent, writeConf = conf)
      }
    }

    def withoutDuplicates(events: RDD[Event]): RDD[Event] = {
      val eventsRepartitioned = events.repartitionByCassandraReplica(KeyspaceName, TableEventBatches)

      eventsRepartitioned.joinWithCassandraTable(
        KeyspaceName,
        TableEventBatches,
        selectedColumns = SomeColumns("eventid", "batchid"),
        joinColumns = SomeColumns("eventid", "batchid")
      ).map(_._1).cache()
    }

    def writeEventPlaces(events: RDD[Event], sparkContext: SparkContext): Unit = {
      Try {
        Timer.time(Log.logDependency("sinks.cassandra", s"write.$TableEventPlaces", _, _)) {
          val defaultZoom = configurationManager.fetchSiteSettings(sparkContext).defaultzoom

          val eventsWithSchema = events.flatMap(CassandraEventPlacesSchema(_, defaultZoom))
          eventsWithSchema.saveToCassandra(KeyspaceName, TableEventPlaces)
        }
      }
    }

    def repartitioned(sparkSession: SparkSession, fortisEventsRDD: RDD[Event]) = {
      fortisEventsRDD.repartition(2 * sparkSession.sparkContext.defaultParallelism).cache()
    }

    def writeAggregates(eventsExploded: RDD[Event], aggregator: OfflineAggregator[_]): Unit = {
      val name = aggregator.getClass.getSimpleName

      Try {
        Timer.time(Log.logDependency("sinks.cassandra", s"aggregateAndSave.$name", _, _)) {
          aggregator.aggregateAndSave(eventsExploded, KeyspaceName)
        }
      } match {
        case Failure(ex) => Log.logError(s"Failed performing offline aggregation $name", ex)
        case Success(_) => // rejoice
      }
    }
  }
}