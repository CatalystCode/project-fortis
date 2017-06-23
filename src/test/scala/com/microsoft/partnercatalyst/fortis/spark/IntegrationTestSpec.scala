package com.microsoft.partnercatalyst.fortis.spark

import scala.util.Properties.{envOrElse, envOrNone}

import org.scalatest.FlatSpec

class IntegrationTestSpec extends FlatSpec {
  protected def checkIfShouldRunWithLocalModels(): Option[String] = {
    val runIntegrationTests = envOrElse("FORTIS_INTEGRATION_TESTS", "false").toBoolean
    val localModels = envOrNone("FORTIS_MODELS_DIRECTORY")
    if (!runIntegrationTests && localModels.isEmpty) {
      cancel("Integration tests disabled and no local models available")
    }
    localModels
  }
}
