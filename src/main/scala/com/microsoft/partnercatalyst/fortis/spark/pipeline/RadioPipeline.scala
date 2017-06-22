package com.microsoft.partnercatalyst.fortis.spark.pipeline

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, AnalyzedItem}
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamProvider}
import com.microsoft.partnercatalyst.fortis.spark.streamwrappers.radio.RadioTranscription
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

object RadioPipeline extends Pipeline {

  override def apply(streamProvider: StreamProvider, streamRegistry: Map[String, List[ConnectorConfig]], ssc: StreamingContext, transformContext: TransformContext): Option[DStream[AnalyzedItem]] = {
    streamProvider.buildStream[RadioTranscription](ssc, streamRegistry("radio")).map(stream =>
      TextPipeline(convertToSchema(stream, transformContext), transformContext))
  }

  private def convertToSchema(stream: DStream[RadioTranscription], transformContext: TransformContext): DStream[AnalyzedItem] = {
    stream.map(transcription => AnalyzedItem(
      body = transcription.text,
      title = "",
      sourceUrl = transcription.radioUrl,
      analysis = Analysis(
        language = Some(transcription.language)
      )))
  }
}