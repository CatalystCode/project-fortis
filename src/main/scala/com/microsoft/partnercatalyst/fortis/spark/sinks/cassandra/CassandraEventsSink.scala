package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import java.util.UUID

import com.datastax.spark.connector.writer.WriteConf
import com.microsoft.partnercatalyst.fortis.spark.dto.FortisEvent
import org.apache.spark.sql.{Dataset, SaveMode, SparkSession}
import org.apache.spark.streaming.dstream.DStream
import com.datastax.spark.connector._
import com.datastax.spark.connector.cql.CassandraConnector
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators._
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto._
import org.apache.spark.rdd.RDD
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.udfs._
import org.apache.spark.streaming.Time
import com.microsoft.partnercatalyst.fortis.spark.logging.FortisTelemetry.{get => Telemetry}
import com.microsoft.partnercatalyst.fortis.spark.logging.Timer

object CassandraEventsSink{
  private val KeyspaceName = "fortis"
  private val TableEvent = "events"
  private val TableEventTopics = "eventtopics"
  private val TableEventPlaces = "eventplaces"
  private val TableEventBatches = "eventbatches"
  private val CassandraFormat = "org.apache.spark.sql.cassandra"

  def apply(dstream: DStream[FortisEvent], sparkSession: SparkSession): Unit = {
    implicit lazy val connector: CassandraConnector = CassandraConnector(sparkSession.sparkContext)

    registerUDFs(sparkSession)

    dstream.foreachRDD{ (eventsRDD, time: Time) => {
      eventsRDD.cache()

      if (!eventsRDD.isEmpty) {
        val batchSize = eventsRDD.count()
        val batchid = UUID.randomUUID().toString
        val fortisEventsRDD = eventsRDD.map(CassandraEventSchema(_, batchid))

        fortisEventsRDD.cache()

        Timer.time(Telemetry.logSinkPhase("writeEvents", _, _, batchSize)) {
          writeFortisEvents(fortisEventsRDD)
        }

        val aggregators = Seq(
          new ConjunctiveTopicsAggregator,
          new PopularPlacesAggregator,
          new PopularTopicAggregator,
          new ComputedTilesAggregator
        )

        val eventBatchDF = Timer.time(Telemetry.logSinkPhase("fetchEventsByBatchId", _, _, batchSize)) {
          fetchEventBatch(batchid, fortisEventsRDD, sparkSession)
        }

        Timer.time(Telemetry.logSinkPhase("writeTagTables", _, _, batchSize)) {
          writeEventBatchToEventTagTables(eventBatchDF, sparkSession)
        }

        aggregators.foreach(aggregator => {
          val eventName = aggregator.FortisTargetTablename

          Timer.time(Telemetry.logSinkPhase(s"aggregate_$eventName", _, _, batchSize)) {
            aggregateEventBatch(eventBatchDF, sparkSession, aggregator)
          }
        })
      }
    }}

    def writeFortisEvents(events: RDD[Event]): Unit = {
      events.saveToCassandra(KeyspaceName, TableEvent, writeConf = WriteConf(ifNotExists = true))
    }

    def registerUDFs(session: SparkSession): Unit ={
      session.udf.register("MeanAverage", FortisUdfFunctions.MeanAverage)
      session.udf.register("SumMentions", FortisUdfFunctions.OptionalSummation)
      session.udf.register("MergeHeatMap", FortisUdfFunctions.MergeHeatMap)
      session.udf.register("SentimentWeightedAvg", SentimentWeightedAvg)
    }

    def fetchEventBatch(batchid: String, events: RDD[Event], session: SparkSession): Dataset[Event] = {
      import session.implicits._

      val addedEventsDF = session.read.format(CassandraFormat)
        .options(Map("keyspace" -> KeyspaceName, "table" -> TableEventBatches))
        .load()

      addedEventsDF.createOrReplaceTempView(TableEventBatches)
      val ds = session.sql(s"select eventid, pipelinekey from $TableEventBatches where batchid = '$batchid'")
      val eventsDS = events.toDF().as[Event]
      val filteredEvents = eventsDS.join(ds, Seq("eventid", "pipelinekey")).as[Event]

      filteredEvents.cache()
      filteredEvents
    }

    def writeEventBatchToEventTagTables(eventDS: Dataset[Event], session: SparkSession): Unit = {
      import session.implicits._
      eventDS.flatMap(CassandraEventTopicSchema(_)).rdd.saveToCassandra(KeyspaceName, TableEventTopics)
      eventDS.flatMap(CassandraEventPlacesSchema(_)).rdd.saveToCassandra(KeyspaceName, TableEventPlaces)
    }

    def aggregateEventBatch(eventDS: Dataset[Event], session: SparkSession, aggregator: FortisAggregator): Unit = {
      val flattenedDF = aggregator.flattenEvents(session, eventDS)
      flattenedDF.createOrReplaceTempView(aggregator.DfTableNameFlattenedEvents)

      val aggregatedDF = aggregator.AggregateEventBatches(session, flattenedDF)
      aggregatedDF.createOrReplaceTempView(aggregator.DfTableNameComputedAggregates)

      val incrementallyUpdatedDF = aggregator.IncrementalUpdate(session, aggregatedDF)
      incrementallyUpdatedDF.write
        .format(CassandraFormat)
        .mode(SaveMode.Append)
        .options(Map("keyspace" -> KeyspaceName, "table" -> aggregator.FortisTargetTablename)).save
    }
  }
}