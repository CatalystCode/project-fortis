package com.microsoft.partnercatalyst.fortis.spark.logging

import scala.util.{Failure, Success, Try}

object Timer {
  def time[R](callback: (Boolean, Long) => Unit)(block: => R): R = {
    val startTime = System.nanoTime()
    val result = Try(block)
    val endTime = System.nanoTime()

    val duration = endTime - startTime
    callback(result.isSuccess, duration)

    result match {
      case Success(r) => r
      case Failure(t) => throw t
    }
  }
}