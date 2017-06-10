package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import java.io.{IOError, IOException}

import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.transforms.ZipModelsProvider
import com.microsoft.partnercatalyst.fortis.spark.transforms.nlp.OpeNER
import ixa.kaflib.Entity

import scala.collection.JavaConversions._
import scala.util.{Failure, Success, Try}

@SerialVersionUID(100L)
class PlaceRecognizer(
  modelsSource: Option[String] = None,
  enabledLanguages: Set[String] = Set("de", "en", "es", "eu", "it", "nl")
) extends Serializable with Loggable {

  @volatile private lazy val modelsProvider = createModelsProvider()

  def extractPlaces(text: String, language: String): Set[String] = {
    if (!enabledLanguages.contains(language)) {
      return Set()
    }

    Try(modelsProvider.ensureModelsAreDownloaded(language)) match {
      case Failure(ex) =>
        logError(s"Unable to load models for language $language", ex)
        Set()

      case Success(resourcesDirectory) =>
        extractPlacesUsingModels(text, language, resourcesDirectory)
    }
  }

  private def extractPlacesUsingModels(text: String, language: String, resourcesDirectory: String): Set[String] = {
    try {
      val kaf = OpeNER.tokAnnotate(resourcesDirectory, text, language)
      OpeNER.posAnnotate(resourcesDirectory, language, kaf)
      OpeNER.nerAnnotate(resourcesDirectory, language, kaf)

      logDebug(s"Analyzed text $text in language $language: $kaf")

      kaf.getEntities.toList.filter(entityIsPlace).map(_.getStr).toSet
    } catch {
      case ex @ (_ : NullPointerException | _ : IOError | _ : IOException) =>
        logError(s"Unable to extract places for language $language", ex)
        Set()
    }
  }

  private def entityIsPlace(entity: Entity) = {
    val entityType = Option(entity.getType).getOrElse("").toLowerCase
    entityType == "location" || entityType == "gpe"
  }

  protected def createModelsProvider(): ZipModelsProvider = {
    new ZipModelsProvider(
      language => s"https://fortismodels.blob.core.windows.net/public/opener-$language.zip",
      modelsSource)
  }
}
