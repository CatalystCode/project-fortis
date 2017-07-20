package com.microsoft.partnercatalyst.fortis.spark.logging

import org.apache.log4j.LogManager

trait Loggable {
  @transient private lazy val log = LogManager.getLogger(getClass.getName)

  def logDebug(message: String): Unit = log.debug(message)
  def logInfo(message: String): Unit = log.info(message)
  def logError(message: String): Unit = log.error(message)
  def logError(message: String, throwable: Throwable): Unit = log.error(message, throwable)
}
