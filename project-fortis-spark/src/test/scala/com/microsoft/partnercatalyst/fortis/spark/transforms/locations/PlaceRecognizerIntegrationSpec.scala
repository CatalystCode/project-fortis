package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import com.microsoft.partnercatalyst.fortis.spark.transforms.ZipModelsProvider

import org.scalatest.FlatSpec

class PlaceRecognizerIntegrationSpec extends FlatSpec {
  "The place recognizer" should "extract correct places" in {
    val modelsProvider = new ZipModelsProvider(
      language => s"https://fortiscentral.blob.core.windows.net/opener/opener-$language.zip")

    val testCases = List(
      ("I went to Paris last week. France was great!", "en", List(("France", 1), ("Paris", 1), ("week", 1))),
      ("A mi me piace Roma.", "it", List(("Roma", 1))),
      ("I love Rome.", "en", List(("Rome", 1)))
    )

    testCases.foreach(test => {
      val recognizer = new PlaceRecognizer(modelsProvider, Some(test._2))
      val places = recognizer.extractPlacesAndOccurrence(test._1)
      assert(places.toSet == test._3.toSet)
    })
  }
}
