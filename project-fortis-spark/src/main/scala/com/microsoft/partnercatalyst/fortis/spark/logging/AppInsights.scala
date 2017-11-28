package com.microsoft.partnercatalyst.fortis.spark.logging

import com.microsoft.applicationinsights.log4j.v1_2.ApplicationInsightsAppender
import org.apache.log4j.Logger

object AppInsights {
  def init(instrumentationKey: Option[String], logger: Option[Logger] = None): Unit = {
    if (instrumentationKey.isEmpty) {
      return
    }

    val appinsightsAppender = new ApplicationInsightsAppender()
    appinsightsAppender.setInstrumentationKey(instrumentationKey.get)
    appinsightsAppender.activateOptions()
    logger.getOrElse(Logger.getRootLogger).addAppender(appinsightsAppender)
  }
}
