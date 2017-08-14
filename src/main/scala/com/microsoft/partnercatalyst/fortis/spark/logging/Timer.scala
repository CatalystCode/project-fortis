package com.microsoft.partnercatalyst.fortis.spark.logging

object Timer {
  def time[R](callback: Long => Unit)(block: => R): R = {
    val startTime = System.nanoTime()
    val result = block
    val endTime = System.nanoTime()
    val duration = endTime - startTime
    callback(duration)
    result
  }
}