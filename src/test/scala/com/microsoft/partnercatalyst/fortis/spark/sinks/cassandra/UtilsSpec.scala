package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import java.text.DecimalFormat

import org.scalatest.FlatSpec

class UtilsSpec extends FlatSpec {
  "The mean function" should "compute the mean" in {
    assert(Utils.mean(List(1, 2, 3, 4)) == 2.5)
    assert(Utils.mean(List(1.2, -0.2, 1.0, 2)) == 1.0)
  }

  "The rescale function" should "rescale numbers" in {
    val formatter = new DecimalFormat("#.#")
    assert(Utils.rescale(List(10, 20, 30), 1, 3) == List(1, 2, 3))
    assert(Utils.rescale(List(0.2, 0.4, 0.6), 0, 1).map(formatter.format) == List("0", "0.5", "1"))
  }
}