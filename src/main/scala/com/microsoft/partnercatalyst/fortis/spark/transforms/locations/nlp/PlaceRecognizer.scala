package com.microsoft.partnercatalyst.fortis.spark.transforms.locations.nlp

import java.io._
import java.net.URL
import java.nio.file.Files
import java.util.Properties

import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.Logger
import eus.ixa.ixa.pipe.nerc.{Annotate => NerAnnotate}
import eus.ixa.ixa.pipe.pos.{Annotate => PosAnnotate}
import eus.ixa.ixa.pipe.tok.{Annotate => TokAnnotate}
import ixa.kaflib.KAFDocument
import net.lingala.zip4j.core.ZipFile

import scala.collection.JavaConversions._
import scala.sys.process._

@SerialVersionUID(100L)
class PlaceRecognizer(
  var modelsDirectory: Option[String] = None,
  enabledLanguages: Set[String] = Set("de", "en", "es", "eu", "it", "nl")
) extends Serializable with Logger {

  def extractPlaces(text: String, language: String): Iterable[String] = {
    if (!enabledLanguages.contains(language)) {
      return Set()
    }

    try {
      ensureModelsAreDownloaded(language)

      val kaf = new KAFDocument(language, "v1.naf")
      tokAnnotate(text, language, kaf)
      posAnnotate(language, kaf)
      nerAnnotate(language, kaf)

      logDebug(s"Analyzed text $text in language $language: $kaf")

      kaf.getEntities.toList.filter(_.getType == "LOCATION").map(_.getStr).toSet
    } catch {
      case npex: NullPointerException =>
        logError(s"Unable to extract places for language $language", npex)
        Set()
      case ioex: IOError =>
        logError(s"Unable to extract places for language $language", ioex)
        Set()
    }
  }

  private def ensureModelsAreDownloaded(language: String): Unit = {
    if (modelsDirectory.nonEmpty && hasModelFiles(modelsDirectory.get, language)) {
      logDebug(s"Using model files from ${modelsDirectory.get}")
      return
    }

    val remotePath = modelsDirectory.getOrElse(s"https://fortismodels.blob.core.windows.net/public/opener-$language.zip")
    if (remotePath.startsWith("http://") || remotePath.startsWith("https://")) {
      if (remotePath.endsWith(".zip")) {
        val localFile = Files.createTempFile(getClass.getSimpleName, ".zip").toAbsolutePath.toString
        val localDir = Files.createTempDirectory(getClass.getSimpleName).toAbsolutePath.toString
        logDebug(s"Starting to download models from $remotePath to $localFile")
        val exitCode = (new URL(remotePath) #> new File(localFile)).!
        logDebug(s"Finished downloading models from $remotePath to $localFile")
        if (exitCode != 0) {
          throw new FileNotFoundException(s"Unable to download models for language $language from $remotePath")
        }
        new ZipFile(localFile).extractAll(localDir)
        new File(localFile).delete()
        modelsDirectory = Some(localDir)
      }
    }

    if (!hasModelFiles(modelsDirectory.get, language)) {
      throw new FileNotFoundException(s"No models for language $language in $remotePath")
    }
  }

  private def hasModelFiles(modelsDir: String, language: String) = {
    val modelFiles = new File(modelsDir).listFiles
    modelFiles != null && modelFiles.exists(_.getName.startsWith(s"$language-"))
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
    properties.setProperty("resourcesDirectory", modelsDirectory.get)
    properties.setProperty("normalize", "default")
    properties.setProperty("untokenizable", "no")
    properties.setProperty("hardParagraph", "no")

    val input = new BufferedReader(new InputStreamReader(new ByteArrayInputStream(text.getBytes("UTF-8"))))
    new TokAnnotate(input, properties)
  }

  private def createPosAnnotate(language: String): PosAnnotate = {
    val properties = new Properties
    properties.setProperty("language", language)
    properties.setProperty("model", new File(modelsDirectory.get, s"$language-pos.bin").getAbsolutePath)
    properties.setProperty("lemmatizerModel", new File(modelsDirectory.get, s"$language-lemmatizer.bin").getAbsolutePath)
    properties.setProperty("resourcesDirectory", modelsDirectory.get)
    properties.setProperty("multiwords", "false")
    properties.setProperty("dictag", "false")
    properties.setProperty("useModelCache", "true")

    new PosAnnotate(properties)
  }

  private def createNerAnnotate(language: String): NerAnnotate = {
    val properties = new Properties
    properties.setProperty("language", language)
    properties.setProperty("model", new File(modelsDirectory.get, s"$language-nerc.bin").getAbsolutePath)
    properties.setProperty("ruleBasedOption", "off")
    properties.setProperty("dictTag", "off")
    properties.setProperty("dictPath", "off")
    properties.setProperty("clearFeatures", "no")
    properties.setProperty("useModelCache", "true")

    new NerAnnotate(properties)
  }
}
