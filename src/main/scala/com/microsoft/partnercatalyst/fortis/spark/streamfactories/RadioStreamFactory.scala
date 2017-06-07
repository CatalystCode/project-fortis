package com.microsoft.partnercatalyst.fortis.spark.streamfactories

import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamFactory}
import com.microsoft.partnercatalyst.fortis.spark.streamwrappers.radio.{RadioStreamUtils, RadioTranscription}
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
