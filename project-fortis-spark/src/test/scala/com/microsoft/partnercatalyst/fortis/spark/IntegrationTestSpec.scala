package com.microsoft.partnercatalyst.fortis.spark

import org.scalatest.FlatSpec

import scala.util.Properties.{envOrElse, envOrNone}

class IntegrationTestSpec extends FlatSpec {
  protected def checkIfShouldRunWithLocalModels(): Option[String] = {
    val runIntegrationTests = envOrElse("FORTIS_INTEGRATION_TESTS", "false").toBoolean
    var localModels = envOrNone("FORTIS_MODELS_DIRECTORY")
    if (localModels.getOrElse("").equals("")) {
      localModels = None
    }
    if (!runIntegrationTests && localModels.isEmpty) {
      cancel("Integration tests disabled and no local models available")
    }
    localModels
  }
}
