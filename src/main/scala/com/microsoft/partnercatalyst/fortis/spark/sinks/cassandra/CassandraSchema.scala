package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import com.microsoft.partnercatalyst.fortis.spark.dto.AnalyzedItem
import net.liftweb.json
import net.liftweb.json.JsonDSL._
import net.liftweb.json.compactRender

case class CassandraRow(
  source: String,
  title: String,
  src_url: String,
  detected_features: String,
  publisher: String,
  topics: String,
  lang: String,
  message_body: String,
  feature_collection: String,
  event_id: String)

object CassandraSchema {
  def apply(item: AnalyzedItem): CassandraRow = {
    implicit val formats = json.DefaultFormats

    CassandraRow(
      source = "", // todo
      title = "", // todo
      src_url = item.source,
      detected_features = compactRender(item.analysis.locations.map(_.wofId)),
      publisher = "", // todo
      topics = compactRender(item.analysis.keywords.map(_.name)),
      lang = item.analysis.language.getOrElse(""),
      message_body = "", // todo
      feature_collection = toFeatureCollection(item), // todo
      event_id = "" // todo
    )
  }

  private def toFeatureCollection(item: AnalyzedItem): String = {
    compactRender(
      ("sentiments_avg" -> item.analysis.sentiments)
      ~
      ("entities" -> item.analysis.entities.map("name" -> _.name)))
  }
}
