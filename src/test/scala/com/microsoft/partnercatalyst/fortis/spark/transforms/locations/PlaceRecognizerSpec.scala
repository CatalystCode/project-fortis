package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import org.apache.log4j.{BasicConfigurator, Level, Logger}
import org.scalatest.FlatSpec

class PlaceRecognizerSpec extends FlatSpec {
  "The place recognizer" should "extract correct places" in {
    val runIntegrationTests = Option(System.getenv("FORTIS_INTEGRATION_TESTS")).getOrElse("false").toBoolean
    val localModels = Option(System.getenv("FORTIS_MODELS_DIRECTORY"))
    if (!runIntegrationTests && localModels.isEmpty) {
      cancel("Integration tests disabled and no local models available")
    }

    BasicConfigurator.configure()
    Logger.getLogger("liblocations").setLevel(Level.DEBUG)

    val recognizer = new PlaceRecognizer(modelsSource = localModels)
    val placesEn1 = recognizer.extractPlaces("I went to Paris last week. France was great!", "en")
    val placesIt = recognizer.extractPlaces("A mi me piace Roma.", "it")
    val placesEn2 = recognizer.extractPlaces("I love Rome.", "en")

    assert(placesEn1 == Set("France", "Paris"))
    assert(placesEn2 == Set("Rome"))
    assert(placesIt == Set("Roma"))
  }
}
