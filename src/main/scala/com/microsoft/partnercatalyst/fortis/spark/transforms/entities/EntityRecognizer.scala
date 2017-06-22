package com.microsoft.partnercatalyst.fortis.spark.transforms.entities

import java.io.{IOError, IOException}

import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.transforms.ZipModelsProvider
import com.microsoft.partnercatalyst.fortis.spark.transforms.nlp.OpeNER
import ixa.kaflib.Entity

import scala.collection.JavaConversions._
import scala.util.{Failure, Success, Try}

@SerialVersionUID(100L)
class EntityRecognizer(
  modelsSource: Option[String] = None,
  enabledLanguages: Set[String] = OpeNER.EnabledLanguages
) extends Serializable with Loggable {

  @volatile private lazy val modelsProvider = createModelsProvider()

  def extractEntities(text: String, language: String): List[Entity] = {
    if (!enabledLanguages.contains(language)) {
      return List()
    }

    Try(modelsProvider.ensureModelsAreDownloaded(language)) match {
      case Failure(ex) =>
        logError(s"Unable to load models for language $language", ex)
        List()

      case Success(resourcesDirectory) =>
        extractEntitiesUsingModels(text, language, resourcesDirectory)
    }
  }

  private def extractEntitiesUsingModels(text: String, language: String, resourcesDirectory: String): List[Entity] = {
    try {
      val kaf = OpeNER.tokAnnotate(resourcesDirectory, text, language)
      OpeNER.posAnnotate(resourcesDirectory, language, kaf)
      OpeNER.nerAnnotate(resourcesDirectory, language, kaf)

      logDebug(s"Analyzed text $text in language $language: $kaf")

      kaf.getEntities.toList
    } catch {
      case ex @ (_ : NullPointerException | _ : IOError | _ : IOException) =>
        logError(s"Unable to extract entities for language $language", ex)
        List()
    }
  }

  protected def createModelsProvider(): ZipModelsProvider = {
    new ZipModelsProvider(
      language => s"https://fortiscentral.blob.core.windows.net/opener/opener-$language.zip",
      modelsSource)
  }
}
