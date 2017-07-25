package com.microsoft.partnercatalyst.fortis.spark

import org.apache.spark.streaming.{Seconds, StreamingContext}
import org.apache.spark.{SparkConf, SparkContext}

object SparkContextCoordinator {

  private val conf = new SparkConf()
    .setAppName(this.getClass.getSimpleName)
    .setMaster("local[*]")
    .set("output.consistency.level", "LOCAL_ONE")

  private var sc: SparkContext = _
  def getOrCreateSparkContext(): SparkContext = {
    if (sc != null) sc
    else {
      sc = new SparkContext(conf)
      sc
    }
  }

  private var ssc: StreamingContext = _
  def getOrCreateStreamingContext(): StreamingContext = {
    if (ssc != null) ssc
    else {
      ssc = new StreamingContext(getOrCreateSparkContext(), Seconds(1))
      ssc
    }
  }

}
