package com.microsoft.partnercatalyst.fortis.spark.pipeline

import java.time.Instant.now
import java.util.UUID.randomUUID

import com.github.catalystcode.fortis.spark.streaming.bing.dto.BingPost
import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, AnalyzedItem}
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamProvider}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

object BingPipeline extends Pipeline {

  override def apply(streamProvider: StreamProvider, streamRegistry: Map[String, List[ConnectorConfig]], ssc: StreamingContext, transformContext: TransformContext): Option[DStream[AnalyzedItem]] = {
    streamProvider.buildStream[BingPost](ssc, streamRegistry("bing")).map(stream =>
      TextPipeline(convertToSchema(stream, transformContext), transformContext))
  }

  private def convertToSchema(stream: DStream[BingPost], transformContext: TransformContext): DStream[AnalyzedItem] = {
    stream.map(post => AnalyzedItem(
      id = randomUUID(),
      createdAtEpoch = now.getEpochSecond,
      body = post.snippet,
      title = post.name,
      publisher = "Bing",
      sourceUrl = post.url,
      analysis = Analysis()
    ))
  }
}