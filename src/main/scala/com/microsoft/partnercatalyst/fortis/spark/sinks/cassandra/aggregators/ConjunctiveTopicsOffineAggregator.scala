package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators

import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.CassandraConjunctiveTopics
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto.{ConjunctiveTopic, Event}
import org.apache.spark.rdd.RDD

class ConjunctiveTopicsOffineAggregator extends OfflineAggregator[ConjunctiveTopic] {

  override def aggregate(events: RDD[Event]): RDD[ConjunctiveTopic] = {
    val conjunctiveTopics = events.flatMap(CassandraConjunctiveTopics(_))
    val allSourcesTopics = conjunctiveTopics.map(_.copy(externalsourceid = "all"))
    val allPipelinesTopics = conjunctiveTopics.map(_.copy(pipelinekey = "all", externalsourceid = "all"))

    val result = conjunctiveTopics.union(allSourcesTopics).union(allPipelinesTopics).keyBy(r=>{(
      r.pipelinekey, r.externalsourceid,
      r.periodtype, r.period, r.periodstartdate, r.periodenddate,
      r.topic, r.conjunctivetopic,
      r.tilex, r.tiley, r.tilez
    )}).reduceByKey((a,b)=>{
      a.copy(mentioncount = a.mentioncount+b.mentioncount)
    }).values
    result
  }

  override def targetTableName(): String = "conjunctivetopics"

}
