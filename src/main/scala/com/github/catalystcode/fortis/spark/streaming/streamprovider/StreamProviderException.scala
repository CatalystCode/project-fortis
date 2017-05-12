package com.github.catalystcode.fortis.spark.streaming.streamprovider

sealed trait StreamProviderException { self: Throwable =>
  // TODO
}
case class InvalidConnectorConfigException() extends Exception("Invalid connector config.") with StreamProviderException
case class UnsupportedConnectorConfigException() extends Exception("Unsupported connector config.") with StreamProviderException