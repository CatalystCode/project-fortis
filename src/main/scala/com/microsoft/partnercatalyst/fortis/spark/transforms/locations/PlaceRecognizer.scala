package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import java.io._
import java.util.Properties

import eus.ixa.ixa.pipe.nerc.{Annotate => NerAnnotate}
import eus.ixa.ixa.pipe.pos.{Annotate => PosAnnotate}
import eus.ixa.ixa.pipe.tok.{Annotate => TokAnnotate}
import ixa.kaflib.KAFDocument

import scala.collection.JavaConversions._

@SerialVersionUID(100L)
class PlaceRecognizer(
  modelsDirectory: String
) extends Serializable with Logger {

  private lazy val supportedLanguages = Set("de", "en", "es", "eu", "it", "nl")

  def extractPlaces(text: String, language: String): Iterable[String] = {
    if (!supportedLanguages.contains(language)) {
      return Set()
    }

    try {
      val kaf = new KAFDocument(language, "v1.naf")
      tokAnnotate(text, language, kaf)
      posAnnotate(language, kaf)
      nerAnnotate(language, kaf)

      kaf.getEntities.toList.filter(_.getType == "LOCATION").map(_.getStr).toSet
    } catch {
      case ioex: IOError =>
        logError(s"Unable to extract places for language $language", ioex)
        Set()
    }
  }

  private def nerAnnotate(language: String, kaf: KAFDocument) = {
    createNerAnnotate(language).annotateNEs(kaf)
  }

  private def posAnnotate(language: String, kaf: KAFDocument) = {
    createPosAnnotate(language).annotatePOSToKAF(kaf)
  }

  private def tokAnnotate(text: String, language: String, kaf: KAFDocument) = {
    createTokAnnotate(language, text).tokenizeToKAF(kaf)
  }

  private def createTokAnnotate(language: String, text: String): TokAnnotate = {
    val properties = new Properties
    properties.setProperty("language", language)
    properties.setProperty("resourcesDirectory", modelsDirectory)
    properties.setProperty("normalize", "default")
    properties.setProperty("untokenizable", "no")
    properties.setProperty("hardParagraph", "no")

    val input = new BufferedReader(new InputStreamReader(new ByteArrayInputStream(text.getBytes("UTF-8"))))
    new TokAnnotate(input, properties)
  }

  private def createPosAnnotate(language: String): PosAnnotate = {
    val properties = new Properties
    properties.setProperty("language", language)
    properties.setProperty("model", new File(modelsDirectory, s"$language-pos.bin").getAbsolutePath)
    properties.setProperty("lemmatizerModel", new File(modelsDirectory, s"$language-lemmatizer.bin").getAbsolutePath)
    properties.setProperty("resourcesDirectory", modelsDirectory)
    properties.setProperty("multiwords", "false")
    properties.setProperty("dictag", "false")

    new PosAnnotate(properties)
  }

  private def createNerAnnotate(language: String): NerAnnotate = {
    val properties = new Properties
    properties.setProperty("language", language)
    properties.setProperty("model", new File(modelsDirectory, s"$language-nerc.bin").getAbsolutePath)
    properties.setProperty("ruleBasedOption", "off")
    properties.setProperty("dictTag", "off")
    properties.setProperty("dictPath", "off")
    properties.setProperty("clearFeatures", "no")

    new NerAnnotate(properties)
  }
}
