package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import com.microsoft.partnercatalyst.fortis.spark.IntegrationTestSpec

class PlaceRecognizerIntegrationSpec extends IntegrationTestSpec {
  "The place recognizer" should "extract correct places" in {
    val localModels = checkIfShouldRunWithLocalModels()

    val recognizer = new PlaceRecognizer(modelsSource = localModels)
    val placesEn1 = recognizer.extractPlaces("I went to Paris last week. France was great!", "en")
    val placesIt = recognizer.extractPlaces("A mi me piace Roma.", "it")
    val placesEn2 = recognizer.extractPlaces("I love Rome.", "en")

    assert(placesEn1 == List("France", "Paris"))
    assert(placesEn2 == List("Rome"))
    assert(placesIt == List("Roma"))
  }
}
