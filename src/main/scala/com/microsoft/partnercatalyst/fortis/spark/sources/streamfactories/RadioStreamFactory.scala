package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.{ConnectorConfig, StreamFactory}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamwrappers.radio.{RadioStreamUtils, RadioTranscription}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

class RadioStreamFactory extends StreamFactory[RadioTranscription]{
  override def createStream(ssc: StreamingContext): PartialFunction[ConnectorConfig, DStream[RadioTranscription]] = {
    case ConnectorConfig("Radio", params) =>
      RadioStreamUtils.createStream(
        ssc, params("radioUrl"), params("audioType"), params("locale"),
        params("subscriptionKey"), params("speechType"), params("outputFormat"))
  }
}
