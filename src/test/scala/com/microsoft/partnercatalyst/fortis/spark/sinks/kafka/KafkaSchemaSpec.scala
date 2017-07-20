package com.microsoft.partnercatalyst.fortis.spark.sinks.kafka

import java.util.UUID

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, Tag}
import com.microsoft.partnercatalyst.fortis.spark.{TestFortisDetails, TestFortisEvent}
import org.scalatest.FlatSpec

class KafkaSchemaSpec extends FlatSpec {
  "The kafka schema" should "convert events to compact json" in {
    val event = TestFortisEvent(
      details = TestFortisDetails(
        id = "b6a38df0-1dd6-4f74-a5a8-6fe9a2bcfedc",
        eventtime = 1500078876,
        body = "body",
        title = "title",
        externalsourceid = "erik",
        pipelinekey = "kafkatest",
        sourceurl = "sourceUrl"),
        analysis = Analysis(
        keywords = List(Tag("tag1", None), Tag("tag2", Some(0.9))),
        language = Some("en")))

    val kafka = KafkaSchema(event)

    assert(kafka == s"""{"language":"en","keywords":["tag1","tag2"],"id":"b6a38df0-1dd6-4f74-a5a8-6fe9a2bcfedc","eventtime":1500078876,"body":"body","title":"title","pipelinekey":"kafkatest","sourceurl":"sourceUrl", "externalsourceid":"erik"}""")
  }
}
