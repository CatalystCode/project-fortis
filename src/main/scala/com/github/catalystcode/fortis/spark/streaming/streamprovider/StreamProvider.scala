package com.github.catalystcode.fortis.spark.streaming.streamprovider

import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream
import scala.collection.immutable.HashMap
import scala.reflect.runtime.universe._

/**
  * Stream provider factory.
  */
object StreamProvider {
  def apply(): StreamProvider = new StreamProvider
}

/**
  * Transforms a set of connector configs into a combined Spark DStream with element type A using the set of
  * pre-configured stream factories for type A.
  * @param typeToFactories
  */
class StreamProvider private(typeToFactories: Map[String, List[StreamFactory[_]]]) {
  protected def this() = this(HashMap[String, List[StreamFactory[_]]]().empty.withDefaultValue(List()))

  /**
    * Yields a new copy of this stream provider but with the supplied set of factories registered for type A.
    * @param factories
    * @param typeName
    * @tparam A
    * @return
    */
  def withFactories[A: TypeTag](factories: List[StreamFactory[A]], typeName: Option[String] = None): StreamProvider
    = new StreamProvider(typeToFactories + (typeNameOrDefault[A](typeName) -> factories))

  /**
    * Creates a combined Spark DStream given a batch of connector configs.
    *
    * Notes:
    * - If a connector config can be handled by more than one of the registered factories for type A,
    *   then only one will be arbitrarily selected and used to create the stream.
    * - If a connector config cannot be handled by any registered factory for type A, TODO and exception is thrown
    * - If any factory fails to create a stream that it should support, TODO an exception is thrown
    *
    * @param streamingContext The Spark Streaming context
    * @param configs The batch of configs whose resulting DStreams should be combined in the result
    * @param typeName The name of the DStream's element type (defaults to typeOf[A].toString)
    * @tparam A The element type of the resulting DStream
    * @return The combined DStream or None if an empty set of configs was provided
    * @throws UnsupportedConnectorConfigException If a connector config cannot be handled by any of the factories registered for type A
    * @throws InvalidConnectorConfigException If a factory expected to be able to handle a connector config but could not
    */
  def buildPipeline[A: TypeTag](
    streamingContext: StreamingContext,
    configs: List[ConnectorConfig],
    typeName: Option[String] = None): Option[DStream[A]] = {

    if (configs.isEmpty)
      return None

    val factories = typeToFactories(typeNameOrDefault[A](typeName)).map(_.asInstanceOf[StreamFactory[A]])
    val totalFunction = factories.map(_.createStream(streamingContext)).reduce(_.orElse(_))
      .orElse[ConnectorConfig, DStream[A]]({
        case _ => throw new UnsupportedConnectorConfigException
      })

    val combinedStream = configs.collect(totalFunction).reduce(_.union(_))
    Some(combinedStream)
  }

  private def typeNameOrDefault[A: TypeTag](typeName: Option[String] = None): String = {
    typeName.getOrElse(typeOf[A].toString)
  }
}