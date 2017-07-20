package com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries

import com.microsoft.partnercatalyst.fortis.spark.dto.Geofence

case class TrendAnalysisRequest(topic: String, period: Period, geofence: Geofence) extends Serializable
