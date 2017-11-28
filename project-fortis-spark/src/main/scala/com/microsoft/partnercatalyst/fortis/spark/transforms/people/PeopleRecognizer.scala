package com.microsoft.partnercatalyst.fortis.spark.transforms.people

import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.transforms.ZipModelsProvider
import com.microsoft.partnercatalyst.fortis.spark.transforms.entities.EntityRecognizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.nlp.OpeNER.entityIsPerson

@SerialVersionUID(100L)
class PeopleRecognizer(
  modelsProvider: ZipModelsProvider,
  language: Option[String]
) extends Serializable with Loggable {

  @volatile private lazy val entityRecognizer = createEntityRecognizer()

  def extractPeople(text: String): List[String] = {
    entityRecognizer.extractEntities(text).filter(entityIsPerson).map(_.getStr)
  }

  protected def createEntityRecognizer(): EntityRecognizer = {
    new EntityRecognizer(modelsProvider, language)
  }
}
