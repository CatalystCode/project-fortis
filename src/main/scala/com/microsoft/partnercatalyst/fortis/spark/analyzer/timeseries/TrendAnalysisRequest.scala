package com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries

case class TrendAnalysisRequest(val topic: String, val period: Period, val area: Area) extends Serializable
