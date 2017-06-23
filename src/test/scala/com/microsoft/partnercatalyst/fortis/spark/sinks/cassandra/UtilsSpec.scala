package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import java.text.DecimalFormat

import org.scalatest.FlatSpec

class UtilsSpec extends FlatSpec {
  "The mean function" should "compute the mean" in {
    assert(Utils.mean(List(1, 2, 3, 4)).contains(2.5))
    assert(Utils.mean(List(1.2, -0.2, 1.0, 2)).contains(1.0))
    assert(Utils.mean(List()).isEmpty)
  }

  "The rescale function" should "rescale numbers" in {
    val formatter = new DecimalFormat("#.#")
    assert(Utils.rescale(List(10, 20, 30), 1, 3).contains(List(1, 2, 3)))
    assert(Utils.rescale(List(0.2, 0.4, 0.6), 0, 1).getOrElse(List()).map(formatter.format) == List("0", "0.5", "1"))
    assert(Utils.rescale(List(1, 1, 1), 0, 1).isEmpty)
  }
}