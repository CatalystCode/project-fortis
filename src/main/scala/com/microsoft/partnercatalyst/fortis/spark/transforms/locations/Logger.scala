package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import org.apache.log4j.LogManager

trait Logger {
  @transient private lazy val log = LogManager.getLogger("liblocations")

  def logDebug(message: String): Unit = log.debug(message)
  def logInfo(message: String): Unit = log.info(message)
  def logError(message: String, throwable: Throwable): Unit = log.error(message, throwable)
}
