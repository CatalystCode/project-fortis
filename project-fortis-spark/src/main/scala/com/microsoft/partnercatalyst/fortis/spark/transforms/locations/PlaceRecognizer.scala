package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import com.microsoft.partnercatalyst.fortis.spark.transforms.ZipModelsProvider
import com.microsoft.partnercatalyst.fortis.spark.transforms.entities.EntityRecognizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.TextNormalizer

@SerialVersionUID(100L)
class PlaceRecognizer(
  modelsProvider: ZipModelsProvider,
  language: Option[String]
) extends Serializable {

  @volatile private lazy val entityRecognizer = createEntityRecognizer()

  def extractPlacesAndOccurrence(text: String): Seq[(String, Int)] = {
    // See: https://github.com/opener-project/kaf/wiki/KAF-structure-overview
    entityRecognizer.extractTerms(TextNormalizer(text, language.getOrElse("")))
      .filter(term => {
        val partOfSpeech = term.getPos
        "N".equals(partOfSpeech) || "R".equals(partOfSpeech)
      })
      .groupBy(_.getStr)
      .map(place => (place._1, place._2.size)).toSeq
  }

  def isValid: Boolean = entityRecognizer.isValid

  protected def createEntityRecognizer(): EntityRecognizer = {
    new EntityRecognizer(modelsProvider, language)
  }
}
