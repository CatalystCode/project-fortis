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
  moods: List[String],
  genders: List[String],
  keywords: List[String],
  entities: List[String],
  summary: String,
  id: String,
  createdAtEpoch: Long,
  body: String,
  title: String,
  publisher: String,
  sourceUrl: String,
  sharedLocations: List[String]
)

object KafkaSchema {
  def apply(event: FortisEvent): String = {
    implicit val defaults = json.DefaultFormats

    compactRender(decompose(KafkaRow(
      language = event.analysis.language.getOrElse(""),
      locations = event.analysis.locations.map(_.wofId),
      sentiments = event.analysis.sentiments,
      moods = event.analysis.moods.map(_.name),
      genders = event.analysis.genders.map(_.name),
      keywords = event.analysis.keywords.map(_.name),
      entities = event.analysis.entities.map(_.name),
      summary = event.analysis.summary.getOrElse(""),
      id = event.details.id.toString,
      createdAtEpoch = event.details.createdAtEpoch,
      body = event.details.body,
      title = event.details.title,
      publisher = event.details.publisher,
      sourceUrl = event.details.sourceUrl,
      sharedLocations = event.details.sharedLocations.map(_.wofId)
    )).transform({
      case JArray(Nil) => JNothing
      case JString("") => JNothing
    }))
  }
}
