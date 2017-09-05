package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import java.util.UUID

import com.datastax.spark.connector._
import com.datastax.spark.connector.cql.CassandraConnector
import com.datastax.spark.connector.writer.{SqlRowWriter, WriteConf}
import com.microsoft.partnercatalyst.fortis.spark.dto.FortisEvent
import com.microsoft.partnercatalyst.fortis.spark.logging.FortisTelemetry.{get => Telemetry}
import com.microsoft.partnercatalyst.fortis.spark.logging.{Loggable, Timer}
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators._
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto._
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.udfs._
import org.apache.spark.rdd.RDD
import org.apache.spark.sql.{Dataset, SaveMode, SparkSession}
import org.apache.spark.streaming.Time
import org.apache.spark.streaming.dstream.DStream

object CassandraEventsSink extends Loggable {
  private val KeyspaceName = "fortis"
  private val TableEvent = "events"
  private val TableEventTopics = "eventtopics"
  private val TableEventPlaces = "eventplaces"
  private val TableEventBatches = "eventbatches"
  private val CassandraFormat = "org.apache.spark.sql.cassandra"

  def apply(dstream: DStream[FortisEvent], sparkSession: SparkSession): Unit = {
    implicit lazy val connector: CassandraConnector = CassandraConnector(sparkSession.sparkContext)

    dstream.foreachRDD { (eventsRDD, time: Time) => {
      Timer.time(Telemetry.logSinkPhase("all", _, _, -1)) {
        Timer.time(Telemetry.logSinkPhase("eventsRDD.cache", _, _, -1)) {
          eventsRDD.cache()
        }

        if (!eventsRDD.isEmpty) {
          val batchSize = eventsRDD.count()
          val batchid = UUID.randomUUID().toString
          val fortisEventsRDD = eventsRDD.map(CassandraEventSchema(_, batchid))

          Timer.time(Telemetry.logSinkPhase("fortisEventsRDD.cache", _, _, -1)) {
            fortisEventsRDD.cache()
          }

          Timer.time(Telemetry.logSinkPhase("writeEvents", _, _, batchSize)) {
            writeFortisEvents(fortisEventsRDD)
          }

          val offlineAggregators = Seq[OfflineAggregator[_]](
            new ConjunctiveTopicsOffineAggregator,
            new PopularPlacesOfflineAggregator,
            new HeatmapOfflineAggregator(sparkSession)
          ).par

          val eventBatchDF = Timer.time(Telemetry.logSinkPhase("fetchEventsByBatchId", _, _, batchSize)) {
            fetchEventBatch(batchid, fortisEventsRDD, sparkSession)
          }

          Timer.time(Telemetry.logSinkPhase("writeTagTables", _, _, batchSize)) {
            writeEventBatchToEventTagTables(eventBatchDF, sparkSession)
          }

          offlineAggregators.foreach(aggregator => {
            val aggregatorName = aggregator.getClass.getSimpleName
            Timer.time(Telemetry.logSinkPhase(s"offlineAggregators.${aggregatorName}", _, _, -1)) {
              try {
                aggregator.aggregateAndSave(fortisEventsRDD, KeyspaceName)
              } catch {
                case e: Exception => {
                  logError(s"Failed performing offline aggregation ${aggregatorName}", e)
                }
              }
            }
          })
        }
      }
    }}

    def writeFortisEvents(events: RDD[Event]): Unit = {
      events.saveToCassandra(KeyspaceName, TableEvent, writeConf = WriteConf(ifNotExists = true))
    }

    def fetchEventBatch(batchid: String, events: RDD[Event], session: SparkSession): Dataset[Event] = {
      import session.implicits._

      Timer.time(Telemetry.logSinkPhase("addedEventsDF", _, _, -1)) {
        val addedEventsDF = session.read.format(CassandraFormat)
          .options(Map("keyspace" -> KeyspaceName, "table" -> TableEventBatches))
          .load()
        addedEventsDF.createOrReplaceTempView(TableEventBatches)
        addedEventsDF
      }

      val filteredEvents = Timer.time(Telemetry.logSinkPhase("filteredEvents", _, _, -1)) {
        val ds = session.sql(s"select eventid, pipelinekey from $TableEventBatches where batchid = '$batchid'")
        val eventsDS = events.toDF().as[Event]
        val filteredEvents = eventsDS.join(ds, Seq("eventid", "pipelinekey")).as[Event]
        filteredEvents
      }

      Timer.time(Telemetry.logSinkPhase("filteredEvents.cache", _, _, -1)) {
        filteredEvents.cache()
        filteredEvents
      }
    }

    def writeEventBatchToEventTagTables(eventDS: Dataset[Event], session: SparkSession): Unit = {
      import session.implicits._

      Timer.time(Telemetry.logSinkPhase(s"saveToCassandra-$TableEventTopics", _, _, -1)) {
        eventDS.flatMap(CassandraEventTopicSchema(_)).rdd.saveToCassandra(KeyspaceName, TableEventTopics)
      }

      Timer.time(Telemetry.logSinkPhase(s"saveToCassandra-$TableEventPlaces", _, _, -1)) {
        eventDS.flatMap(CassandraEventPlacesSchema(_)).rdd.saveToCassandra(KeyspaceName, TableEventPlaces)
      }
    }
  }
}