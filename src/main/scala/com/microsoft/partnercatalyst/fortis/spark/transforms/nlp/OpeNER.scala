package com.microsoft.partnercatalyst.fortis.spark.transforms.nlp

import java.io.{BufferedReader, ByteArrayInputStream, File, InputStreamReader}
import java.util.Properties

import eus.ixa.ixa.pipe.nerc.{Annotate => NerAnnotate}
import eus.ixa.ixa.pipe.pos.{Annotate => PosAnnotate}
import eus.ixa.ixa.pipe.tok.{Annotate => TokAnnotate}
import ixa.kaflib.{Entity, KAFDocument}

object OpeNER {
  val EnabledLanguages = Set("de", "en", "es", "eu", "it", "nl")

  def tokAnnotate(resourcesDirectory: String, text: String, language: String): KAFDocument = {
    val kaf = new KAFDocument(language, "v1.naf")
    createTokAnnotate(resourcesDirectory, language, text).tokenizeToKAF(kaf)
    kaf
  }

  def posAnnotate(resourcesDirectory: String, language: String, kaf: KAFDocument): Unit = {
    createPosAnnotate(resourcesDirectory, language).annotatePOSToKAF(kaf)
  }

  def nerAnnotate(resourcesDirectory: String, language: String, kaf: KAFDocument): Unit = {
    createNerAnnotate(resourcesDirectory, language).annotateNEs(kaf)
  }

  def entityIsPlace(entity: Entity): Boolean = entityIs(entity, Set("location", "gpe"))

  private def entityIs(entity: Entity, types: Set[String]): Boolean = {
    val entityType = Option(entity.getType).getOrElse("").toLowerCase
    types.contains(entityType)
  }

  private def createTokAnnotate(resourcesDirectory: String, language: String, text: String): TokAnnotate = {
    val properties = new Properties
    properties.setProperty("language", language)
    properties.setProperty("resourcesDirectory", resourcesDirectory)
    properties.setProperty("normalize", "default")
    properties.setProperty("untokenizable", "no")
    properties.setProperty("hardParagraph", "no")

    val input = new BufferedReader(new InputStreamReader(new ByteArrayInputStream(text.getBytes("UTF-8"))))
    new TokAnnotate(input, properties)
  }

  private def createPosAnnotate(resourcesDirectory: String, language: String): PosAnnotate = {
    val properties = new Properties
    properties.setProperty("language", language)
    properties.setProperty("model", new File(resourcesDirectory, s"$language-pos.bin").getAbsolutePath)
    properties.setProperty("lemmatizerModel", new File(resourcesDirectory, s"$language-lemmatizer.bin").getAbsolutePath)
    properties.setProperty("resourcesDirectory", resourcesDirectory)
    properties.setProperty("multiwords", "false")
    properties.setProperty("dictag", "false")
    properties.setProperty("useModelCache", "true")

    new PosAnnotate(properties)
  }

  private def createNerAnnotate(resourcesDirectory: String, language: String): NerAnnotate = {
    val properties = new Properties
    properties.setProperty("language", language)
    properties.setProperty("model", new File(resourcesDirectory, s"$language-nerc.bin").getAbsolutePath)
    properties.setProperty("ruleBasedOption", "off")
    properties.setProperty("dictTag", "off")
    properties.setProperty("dictPath", "off")
    properties.setProperty("clearFeatures", "no")
    properties.setProperty("useModelCache", "true")

    new NerAnnotate(properties)
  }
}
