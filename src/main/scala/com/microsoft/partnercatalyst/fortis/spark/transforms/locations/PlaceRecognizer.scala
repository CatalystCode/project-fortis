package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.transforms.ZipModelsProvider
import com.microsoft.partnercatalyst.fortis.spark.transforms.entities.EntityRecognizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.TextNormalizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.nlp.OpeNER

@SerialVersionUID(100L)
class PlaceRecognizer(
  modelsProvider: ZipModelsProvider,
  language: Option[String]
) extends Serializable with Loggable {

  @volatile private lazy val entityRecognizer = createEntityRecognizer()

  def extractPlacesAndOccurrance(text: String): Seq[(String, Int)] = {
    entityRecognizer.extractEntities(TextNormalizer(text, language.getOrElse("")))
//      .filter(OpeNER.entityIsPlace)
      .map(place => (place.getStr, place.getSpans.size()))
  }

  def isValid: Boolean = entityRecognizer.isValid

  protected def createEntityRecognizer(): EntityRecognizer = {
    new EntityRecognizer(modelsProvider, language)
  }
}
