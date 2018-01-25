package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators

import com.datastax.spark.connector.writer.SqlRowWriter
import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.CassandraConjunctiveTopics
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto.{ConjunctiveTopic, Event}
import org.apache.spark.rdd.RDD

import com.datastax.spark.connector._

class ConjunctiveTopicsOffineAggregator(configurationManager: ConfigurationManager) extends OfflineAggregator[ConjunctiveTopic] {

  override def aggregate(events: RDD[Event]): RDD[ConjunctiveTopic] = {
    val siteSettings = configurationManager.fetchSiteSettings(events.sparkContext)
    val conjunctiveTopics = events.flatMap(CassandraConjunctiveTopics(_, siteSettings.defaultzoom))

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
      case _ =>
        implicit val rowWriter: SqlRowWriter.Factory.type = SqlRowWriter.Factory
        topics.saveToCassandra(keyspace, "conjunctivetopics")
    }

    topics.unpersist(blocking = true)
  }

}
