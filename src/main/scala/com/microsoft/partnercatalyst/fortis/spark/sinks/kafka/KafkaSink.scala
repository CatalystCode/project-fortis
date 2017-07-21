package com.microsoft.partnercatalyst.fortis.spark.sinks.kafka

import java.util.Properties

import com.esotericsoftware.kryo.serializers.DefaultSerializers.StringSerializer
import com.github.benfradet.spark.kafka010.writer.dStreamToKafkaWriter
import com.microsoft.partnercatalyst.fortis.spark.dto.FortisEvent
import net.liftweb.json
import net.liftweb.json.Extraction.decompose
import net.liftweb.json.JsonAST.{JArray, JNothing, JString, compactRender}
import org.apache.kafka.clients.producer.ProducerRecord
import org.apache.spark.streaming.dstream.DStream

object KafkaSink {
  def apply(dstream: Option[DStream[FortisEvent]], host: String, topic: String): Unit = {
    if (dstream.isDefined) {
      val kafkaConf = new Properties
      kafkaConf.setProperty("bootstrap.servers", host)
      kafkaConf.setProperty("key.serializer", classOf[StringSerializer].getName)
      kafkaConf.setProperty("value.serializer", classOf[StringSerializer].getName)

      dstream.get.map(KafkaSchema(_)).writeToKafka(kafkaConf, row => new ProducerRecord[String, String](topic, row))
    }
  }
}

case class KafkaRow(
  language: String,
  locations: List[String],
  sentiments: List[Double],
  genders: List[String],
  keywords: List[String],
  entities: List[String],
  summary: String,
  pipelinekey: String,
  eventid: String,
  eventtime: Long,
  body: String,
  title: String,
  externalsourceid: String,
  sourceurl: String
)

object KafkaSchema {
  def apply(event: FortisEvent): String = {
    implicit val defaults = json.DefaultFormats

    compactRender(decompose(KafkaRow(
      language = event.analysis.language.getOrElse(""),
      locations = event.analysis.locations.map(_.wofId),
      sentiments = event.analysis.sentiments,
      genders = event.analysis.genders.map(_.name),
      keywords = event.analysis.keywords.map(_.name),
      pipelinekey = event.details.pipelinekey,
      entities = event.analysis.entities.map(_.name),
      summary = event.analysis.summary.getOrElse(""),
      eventid = event.details.eventid.toString,
      eventtime = event.details.eventtime,
      body = event.details.body,
      title = event.details.title,
      externalsourceid = event.details.externalsourceid,
      sourceurl = event.details.sourceurl
    )).transform({
      case JArray(Nil) => JNothing
      case JString("") => JNothing
    }))
  }
}
