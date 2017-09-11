package com.microsoft.partnercatalyst.fortis.spark.dto

import org.scalatest.FlatSpec

class FortisEventSpec extends FlatSpec {
  "The Fortis event" should "have an ordering defined by layer" in {
    val country1 = Location(wofId = "id1", latitude = -1, longitude = -1, layer = "country")
    val country2 = Location(wofId = "id3", latitude = -1, longitude = -1, layer = "country")
    val neighbourhood = Location(wofId = "id2", latitude = -1, longitude = -1, layer = "neighbourhood")

    assert(country1 > neighbourhood)
    assert(country1.compare(country2) == 0)
    assert(neighbourhood < country2)
  }

  it should "have the ordering handle null and unknown values" in {
    val country = Location(wofId = "id1", latitude = -1, longitude = -1, layer = "country")
    val nullLayer = Location(wofId = "id2", latitude = -1, longitude = -1, layer = null)
    val unknownLayer = Location(wofId = "id3", latitude = -1, longitude = -1, layer = "unknown layer type")

    assert(country < nullLayer)
    assert(country < unknownLayer)
  }
}
