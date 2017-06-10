package com.microsoft.partnercatalyst.fortis.spark

import org.scalatest.FlatSpec

class IntegrationTestSpec extends FlatSpec {
  protected def checkIfShouldRunWithLocalModels(): Option[String] = {
    val runIntegrationTests = Option(System.getenv("FORTIS_INTEGRATION_TESTS")).getOrElse("false").toBoolean
    val localModels = Option(System.getenv("FORTIS_MODELS_DIRECTORY"))
    if (!runIntegrationTests && localModels.isEmpty) {
      cancel("Integration tests disabled and no local models available")
    }
    localModels
  }
}
