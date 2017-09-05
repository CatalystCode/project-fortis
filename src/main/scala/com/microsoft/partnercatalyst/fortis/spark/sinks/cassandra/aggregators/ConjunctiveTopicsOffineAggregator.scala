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
      r.periodtype, r.perioddate,
      r.topic, r.conjunctivetopic,
      r.tileid, r.tilez
    )}).reduceByKey((a,b)=>{
      a.copy(mentioncount = a.mentioncount+b.mentioncount)
    }).values
  }

  override def aggregateAndSave(events: RDD[Event], keyspace: String): Unit = {
    val topics = aggregate(events).cache()
    topics.count() match {
      case 0 => return
      case _ => {
        implicit val rowWriter = SqlRowWriter.Factory
        topics.saveToCassandra(keyspace, "conjunctivetopics")
      }
    }
  }

}
