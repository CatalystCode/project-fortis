package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import java.util.UUID
import com.datastax.spark.connector.writer.{RowWriterFactory, WriteConf}
import com.microsoft.partnercatalyst.fortis.spark.dto.FortisEvent
import org.apache.spark.sql.{Dataset, SaveMode, SparkSession}
import org.apache.spark.streaming.dstream.DStream
import com.datastax.spark.connector._
import com.datastax.spark.connector.mapper.ColumnMapper
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators._
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto._
import org.apache.spark.rdd.RDD
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.udfs._
import org.apache.spark.streaming.Time

import scala.util.{Failure, Success, Try}

object CassandraEventsSink{
  private val KeyspaceName = "fortis"
  private val TableEvent = "events"
  private val TableEventTopics = "eventtopics"
  private val TableEventPlaces = "eventplaces"
  private val TableEventBatches = "eventbatches"
  private val CassandraFormat = "org.apache.spark.sql.cassandra"
  private val CassandraRetryIntervalMS = 2000
  private val CassandraMaxRetryAttempts = 3

  def apply(dstream: DStream[FortisEvent], sparkSession: SparkSession): Unit = {
      val batchStream = dstream.foreachRDD{ (eventsRDD, time: Time) => {
        if(!eventsRDD.isEmpty) {
          val batchid = UUID.randomUUID().toString
          val fortisEventsRDD = eventsRDD.map(CassandraEventSchema(_, batchid))
          writeFortisEvents(fortisEventsRDD, batchid)
          val aggregators = Seq(new PopularPlacesAggregator, new PopularTopicAggregator, new ComputedTilesAggregator).par
          val session = SparkSession.builder().config(eventsRDD.sparkContext.getConf)
            .appName(eventsRDD.sparkContext.appName)

            .getOrCreate()

            registerUDFs(session)
            val eventBatchDF = fetchEventBatch(batchid, fortisEventsRDD, session)
            writeEventBatchToEventTagTables(eventBatchDF, session)
            aggregators.map(aggregator => {
              aggregateEventBatch(eventBatchDF, session, aggregator)
            })
        }
      }}
  }

  private def writeFortisEvents(events: RDD[Event], batchId: String ): Unit = {
    events.saveToCassandra(KeyspaceName, TableEvent, writeConf = WriteConf(ifNotExists = true))
  }

  private def registerUDFs(session: SparkSession): Unit ={
    session.sqlContext.udf.register("MeanAverage", FortisUdfFunctions.MeanAverage)
    session.sqlContext.udf.register("SumMentions", FortisUdfFunctions.OptionalSummation)
    session.sqlContext.udf.register("MergeHeatMap", FortisUdfFunctions.MergeHeatMap)
    session.sqlContext.udf.register("SentimentWeightedAvg", SentimentWeightedAvg)
  }

  private def fetchEventBatch(batchid: String, events: RDD[Event], session: SparkSession): Dataset[Event] = {
    import session.sqlContext.implicits._

    val addedEventsDF = session.sqlContext.read.format(CassandraFormat)
      .options(Map("keyspace" -> KeyspaceName, "table" -> TableEventBatches))
      .load()

    addedEventsDF.createOrReplaceTempView(TableEventBatches)
    val ds = session.sqlContext.sql(s"select eventid, pipelinekey from $TableEventBatches where batchid = '$batchid'")
    val eventsDS = events.toDF().as[Event]
    val filteredEvents = eventsDS.join(ds, Seq("eventid", "pipelinekey"))
    filteredEvents.cache()
    filteredEvents.as[Event]
  }

  private def writeEventBatchToEventTagTables(eventDS: Dataset[Event], session: SparkSession): Unit = {
    import session.implicits._
    saveRddToCassandra[EventTopics](KeyspaceName, TableEventTopics, eventDS.flatMap(CassandraEventTopicSchema(_)).rdd)
    saveRddToCassandra[EventPlaces](KeyspaceName, TableEventPlaces, eventDS.flatMap(CassandraEventPlacesSchema(_)).rdd)
  }

  private def saveRddToCassandra[T](keyspace: String, table: String, rdd: RDD[T], attempt: Int = 0)(
                                      implicit rwf: RowWriterFactory[T], columnMapper: ColumnMapper[T]
                                 ): Unit = {
    Try(rdd.saveToCassandra(keyspace, table)) match {
      case Success(_) => None
      case Failure(ex) =>
        ex.printStackTrace
        Thread.sleep(CassandraRetryIntervalMS * attempt)
        attempt match {
          case retry if attempt < CassandraMaxRetryAttempts => saveRddToCassandra(keyspace, table, rdd, attempt + 1)
          case(_) => throw ex
        }
    }
  }

  private def aggregateEventBatch(eventDS: Dataset[Event], session: SparkSession,
                                  aggregator: FortisAggregator, attempt: Int = 0): Unit = {
  try {
    val flattenedDF = aggregator.flattenEvents(session, eventDS)
    flattenedDF.createOrReplaceTempView(aggregator.DfTableNameFlattenedEvents)

    val aggregatedDF = aggregator.AggregateEventBatches(session, flattenedDF)
    aggregatedDF.createOrReplaceTempView(aggregator.DfTableNameComputedAggregates)

    val incrementallyUpdatedDF = aggregator.IncrementalUpdate(session, aggregatedDF)
    incrementallyUpdatedDF.write
      .format(CassandraFormat)
      .mode(SaveMode.Append)
      .options(Map("keyspace" -> KeyspaceName, "table" -> aggregator.FortisTargetTablename)).save
  } catch {
    case ex if attempt < CassandraMaxRetryAttempts => {
      ex.printStackTrace()
      Thread.sleep(CassandraRetryIntervalMS * attempt)
      aggregateEventBatch(eventDS, session, aggregator, attempt + 1)
    }
    case ex : Throwable => ex.printStackTrace()
      throw ex
  }
  }
}