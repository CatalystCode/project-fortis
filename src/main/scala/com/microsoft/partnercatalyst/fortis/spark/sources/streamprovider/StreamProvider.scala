package com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider

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
  */
class StreamProvider private(typeToFactories: Map[String, List[StreamFactory[_]]]) {
  protected def this() = this(HashMap[String, List[StreamFactory[_]]]().empty.withDefaultValue(List()))

  /**
    * Yields a new copy of this stream provider but with the supplied set of factories registered for type A.
    *
    * @param factories The set of factories to register for type A.
    * @param typeName The type name of A (defaults to typeOf[A].toString)
    * @tparam A The element type of the DStreams yielded by the provided set of factories.
    * @return The stream provider instance with new factories registered.
    */
  def withFactories[A: TypeTag](factories: List[StreamFactory[A]], typeName: Option[String] = None): StreamProvider
    = new StreamProvider(typeToFactories + (typeNameOrDefault[A](typeName) -> factories))

  /**
    * Creates a combined Spark DStream given a batch of connector configs.
    *
    * Notes:
    * - It is considered a programmer error for stream creation to be defined on multiple factories registered to type A
    *   for any single connector config. When compiled with asserts, this is checked. Without, only one stream factory
    *   will be arbitrarily selected and used to create the stream.
    *
    * @param streamingContext The Spark Streaming context
    * @param configs The batch of configs whose resulting DStreams should be combined in the result
    * @param typeName The name of the DStream's element type (defaults to typeOf[A].toString)
    * @tparam A The element type of the resulting DStream
    * @return The combined DStream or None if an empty set of configs was provided
    * @throws UnsupportedConnectorConfigException If a connector config cannot be handled by any of the factories registered for type A
    * @throws InvalidConnectorConfigException If a factory expected to be able to handle a connector config but could not
    */
  def buildStream[A: TypeTag](
    streamingContext: StreamingContext,
    configs: List[ConnectorConfig],
    ignoreUnsupportedConfigs: Boolean = false,
    typeName: Option[String] = None): Option[DStream[A]] = {

    if (configs.isEmpty)
      return None

    val factories = typeToFactories(typeNameOrDefault[A](typeName)).map(_.asInstanceOf[StreamFactory[A]])

    assert(!configs.exists(config => factories.count(_.createStream(streamingContext).isDefinedAt(config)) > 1),
      s"stream creation must not be defined for more than 1 factory registered for type '$typeName' for a single config"
    )

    def throwUnsupported: PartialFunction[ConnectorConfig, DStream[A]] = {
      case _ if !ignoreUnsupportedConfigs => throw new UnsupportedConnectorConfigException
    }

    val createStream: PartialFunction[ConnectorConfig, DStream[A]] = factories.map(_.createStream(streamingContext)).reduceOption(_.orElse(_)) match {
      case Some(pf) => pf.orElse(throwUnsupported)
      case None => throwUnsupported
    }

    configs.collect(createStream).reduceOption(_.union(_))
  }

  private def typeNameOrDefault[A: TypeTag](typeName: Option[String] = None): String = {
    typeName.getOrElse(typeOf[A].toString)
  }
}