package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators

import com.datastax.spark.connector._
import com.datastax.spark.connector.writer.SqlRowWriter
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.CassandraPopularPlaces
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto.{Event, PopularPlace}
import org.apache.spark.rdd.RDD

class PopularPlacesOfflineAggregator extends OfflineAggregator[PopularPlace] {

  override def aggregate(events: RDD[Event]): RDD[PopularPlace] = {
    val places = events.flatMap(event=>{
      Seq(
        event,
        event.copy(externalsourceid = "all"),
        event.copy(pipelinekey = "all", externalsourceid = "all")
      )
    }).flatMap(CassandraPopularPlaces(_))

    places.keyBy(r=>{(
      r.placeid,
      r.periodtype, r.perioddate,
      r.conjunctiontopic1, r.conjunctiontopic2, r.conjunctiontopic3,
      r.tileid, r.tilez,
      r.pipelinekey, r.externalsourceid
    )}).reduceByKey((a,b)=>{
      val mentionCount = a.mentioncount + b.mentioncount
      val sentimentNumerator = a.avgsentimentnumerator + b.avgsentimentnumerator
      a.copy(
        mentioncount = mentionCount,
        avgsentimentnumerator = sentimentNumerator
      )
    }).values
  }

  override def aggregateAndSave(events: RDD[Event], keyspace: String): Unit = {
    val places = aggregate(events).cache()
    places.count() match {
      case 0 => return
      case _ => {
        implicit val rowWriter = SqlRowWriter.Factory
        places.saveToCassandra(keyspace, "popularplaces")
      }
    }
  }

}
