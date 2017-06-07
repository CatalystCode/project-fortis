package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import java.io.IOError

import com.microsoft.partnercatalyst.fortis.spark.transforms.ZipModelsProvider
import com.microsoft.partnercatalyst.fortis.spark.transforms.nlp.OpeNER
import ixa.kaflib.Entity

import scala.collection.JavaConversions._

@SerialVersionUID(100L)
class PlaceRecognizer(
  modelsSource: Option[String] = None,
  enabledLanguages: Set[String] = Set("de", "en", "es", "eu", "it", "nl")
) extends Serializable with Logger {

  @volatile private lazy val modelsProvider = new ZipModelsProvider(formatModelsDownloadUrl, modelsSource)

  def extractPlaces(text: String, language: String): Iterable[String] = {
    if (!enabledLanguages.contains(language)) {
      return Set()
    }

    try {
      val resourcesDirectory = modelsProvider.ensureModelsAreDownloaded(language)

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

  private def formatModelsDownloadUrl(language: String): String = {
    s"https://fortismodels.blob.core.windows.net/public/opener-$language.zip"
  }
}
