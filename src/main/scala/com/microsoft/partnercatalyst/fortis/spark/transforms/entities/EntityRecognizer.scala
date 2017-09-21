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
  modelsProvider: ZipModelsProvider,
  language: Option[String]
) extends Serializable with Loggable {

  def extractEntities(text: String): List[Entity] = {
    if (!isValid) {
      return List()
    }

    Try(modelsProvider.ensureModelsAreDownloaded(language.get)) match {
      case Failure(ex) =>
        logError(s"Unable to load models for language $language", ex)
        List()

      case Success(resourcesDirectory) =>
        extractEntitiesUsingModels(text, resourcesDirectory)
    }
  }

  def isValid: Boolean = language.isDefined && OpeNER.EnabledLanguages.contains(language)

  private def extractEntitiesUsingModels(text: String, resourcesDirectory: String): List[Entity] = {
    try {
      val kaf = OpeNER.tokAnnotate(resourcesDirectory, text, language.get)
      OpeNER.posAnnotate(resourcesDirectory, language.get, kaf)
      OpeNER.nerAnnotate(resourcesDirectory, language.get, kaf)

      logDebug(s"Analyzed text $text in language $language: $kaf")

      kaf.getEntities.toList
    } catch {
      case ex @ (_ : NullPointerException | _ : IOError | _ : IOException) =>
        logError(s"Unable to extract entities for language $language", ex)
        List()
    }
  }
}
