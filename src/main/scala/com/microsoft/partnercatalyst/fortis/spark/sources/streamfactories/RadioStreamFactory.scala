package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.{ConnectorConfig, StreamFactory}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamwrappers.radio.{RadioStreamUtils, RadioTranscription}
import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

class RadioStreamFactory extends StreamFactoryBase[RadioTranscription]{
  override protected def canHandle(connectorConfig: ConnectorConfig): Boolean = {
    connectorConfig.name == "Radio"
  }

  override protected def buildStream(ssc: StreamingContext, configurationManager: ConfigurationManager, connectorConfig: ConnectorConfig): DStream[RadioTranscription] = {
    import ParameterExtensions._

    val params = connectorConfig.parameters

    RadioStreamUtils.createStream(ssc,
      params.getAs[String]("radioUrl"),
      params.getAs[String]("audioType"),
      params.getAs[String]("locale"),
      params.getAs[String]("subscriptionKey"),
      params.getAs[String]("speechType"),
      params.getAs[String]("outputFormat")
    )
  }
}
