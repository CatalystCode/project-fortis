package com.microsoft.partnercatalyst.fortis.spark.transforms.locations.nlp

import java.io.IOError

import com.microsoft.partnercatalyst.fortis.spark.transforms.HasZipModels
import ixa.kaflib.Entity

import scala.collection.JavaConversions._

@SerialVersionUID(100L)
class PlaceRecognizer(
  modelsSource: Option[String] = None,
  enabledLanguages: Set[String] = Set("de", "en", "es", "eu", "it", "nl")
) extends HasZipModels(modelsSource) {

  def extractPlaces(text: String, language: String): Iterable[String] = {
    if (!enabledLanguages.contains(language)) {
      return Set()
    }

    try {
      val resourcesDirectory = ensureModelsAreDownloaded(language)

      val kaf = OpeNER.tokAnnotate(resourcesDirectory, text, language)
      OpeNER.posAnnotate(resourcesDirectory, language, kaf)
      OpeNER.nerAnnotate(resourcesDirectory, language, kaf)

      logDebug(s"Analyzed text $text in language $language: $kaf")

      kaf.getEntities.toList.filter(entityIsPlace).map(_.getStr).toSet
    } catch {
      case ex @ (_ : NullPointerException | _ : IOError) =>
        logError(s"Unable to extract places for language $language", ex)
        Set()
    }
  }

  private def entityIsPlace(entity: Entity) = {
    val entityType = Option(entity.getType).getOrElse("").toLowerCase
    entityType == "location" || entityType == "gpe"
  }

  override protected def formatModelsDownloadUrl(language: String): String = {
    s"https://fortismodels.blob.core.windows.net/public/opener-$language.zip"
  }
}
