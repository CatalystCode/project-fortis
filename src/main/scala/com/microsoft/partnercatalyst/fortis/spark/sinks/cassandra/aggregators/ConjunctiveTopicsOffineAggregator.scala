package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators

import com.datastax.spark.connector._
import com.datastax.spark.connector.writer.SqlRowWriter
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.CassandraConjunctiveTopics
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto.{ConjunctiveTopic, Event}
import org.apache.spark.rdd.RDD

class ConjunctiveTopicsOffineAggregator extends OfflineAggregator[ConjunctiveTopic] {

  override def aggregate(events: RDD[Event]): RDD[ConjunctiveTopic] = {
    val conjunctiveTopics = events.flatMap(event=>{
      Seq(
        event,
        event.copy(externalsourceid = "all"),
        event.copy(pipelinekey = "all", externalsourceid = "all")
      )
    }).flatMap(CassandraConjunctiveTopics(_))

    conjunctiveTopics.keyBy(r=>{(
      r.pipelinekey, r.externalsourceid,
      r.periodtype, r.period, r.periodstartdate, r.periodenddate,
      r.topic, r.conjunctivetopic,
      r.tilex, r.tiley, r.tilez
    )}).reduceByKey((a,b)=>{
      a.copy(mentioncount = a.mentioncount+b.mentioncount)
    }).values
  }

  override def aggregateAndSave(events: RDD[Event], keyspace: String): Unit = {
    implicit val rowWriter = SqlRowWriter.Factory
    aggregate(events).saveToCassandra(keyspace, "conjunctivetopics")
  }

}
