package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.microsoft.partnercatalyst.fortis.spark.logging.FortisTelemetry
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.{ConnectorConfig, InvalidConnectorConfigException, StreamFactory}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

import scala.reflect.ClassTag
import scala.util.Try

abstract class StreamFactoryBase[A: ClassTag] extends StreamFactory[A]{
  override def createStream(ssc: StreamingContext): PartialFunction[ConnectorConfig, DStream[A]] = {
    case config if canHandle(config) =>
      val stream = buildStream(ssc, config).transform(rdd => {
        // Bake telemetry for incoming batch sizes into resulting stream
        val batchSize = rdd.count()
        val streamId = config.parameters("streamId").toString
        val connectorName = config.name
        val telemetry = FortisTelemetry.get
        telemetry.logIncomingEventBatch(streamId, connectorName, batchSize)

        rdd
      })

      val desiredPartitions = getPartitionCount(ssc, config)
      val result = desiredPartitions match {
        case Some(partitions) => partitions match {
          case _ if partitions > 0 => stream.repartition(partitions)
          case _ => stream
        }

        // By default (not specified), repartition using default parallelism
        case None => stream.repartition(ssc.sparkContext.defaultParallelism)
      }

      result.cache()
  }

  /**
    * Gets the desired number of partitions for the RDDs of the created stream.
    *
    * @param ssc The streaming context used to open the stream.
    * @param config The config used to construct the stream.
    * @return Some(N) where N > 0 will repartition RDDs into N partitions.
    *         Some(N) where N <= 0 will avoid repartitioning entirely.
    *         None will default to repartitioning by default parallelism.
    */
  protected def getPartitionCount(ssc: StreamingContext, config: ConnectorConfig): Option[Int] = {
    // Get desired number of partitions specified in the stream's param bundle
    Option(config.parameters.getOrElse("partitions", null)) match {
      case Some(partitions) =>
        val parsed = Try(partitions.toString.toInt).getOrElse(throw new InvalidConnectorConfigException)

        if (parsed < 0)
          throw new InvalidConnectorConfigException

        Some(parsed)
      case None => None
    }
  }

  protected def canHandle(connectorConfig: ConnectorConfig): Boolean
  protected def buildStream(ssc: StreamingContext, connectorConfig: ConnectorConfig): DStream[A]
}
