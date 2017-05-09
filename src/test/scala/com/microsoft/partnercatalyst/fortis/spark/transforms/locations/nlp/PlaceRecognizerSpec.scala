package com.microsoft.partnercatalyst.fortis.spark.transforms.locations.nlp

import org.scalatest.FlatSpec

class PlaceRecognizerSpec extends FlatSpec {
  "The place recognizer" should "extract correct places" in {
    val recognizer = new PlaceRecognizer()
    val places = recognizer.extractPlaces("I went to Paris last week. France was great!", "en")
    assert(places == Set("France", "Paris"))
  }
}
