package com.microsoft.partnercatalyst.fortis.spark.pipeline

import com.microsoft.partnercatalyst.fortis.spark.dto.FortisItem
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamProvider}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

trait Pipeline {
  def apply(streamProvider: StreamProvider, streamRegistry: Map[String, List[ConnectorConfig]], ssc: StreamingContext,
    transformContext: TransformContext): Option[DStream[FortisItem]]
}
