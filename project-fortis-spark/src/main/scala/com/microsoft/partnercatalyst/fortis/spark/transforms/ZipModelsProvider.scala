package com.microsoft.partnercatalyst.fortis.spark.transforms

import java.io.{File, FileNotFoundException}
import java.lang.System.currentTimeMillis
import java.net.URL
import java.nio.file.Files
import java.util.concurrent.ConcurrentHashMap

import com.microsoft.partnercatalyst.fortis.spark.logging.FortisTelemetry.{get => Log}
import net.lingala.zip4j.core.ZipFile

import scala.collection.JavaConversions._
import scala.sys.process._
import scala.util.{Failure, Success, Try}

@SerialVersionUID(100L)
class ZipModelsProvider(
  modelsUrlFromLanguage: String => String
) extends Serializable {

  @transient private lazy val modelDirectories = new ConcurrentHashMap[String, String]

  def ensureModelsAreDownloaded(language: String): String = {
    val startTime = currentTimeMillis()
    val previouslyDownloadedPath = modelDirectories.getOrElse(language, "")
    if (hasModelFiles(previouslyDownloadedPath, language)) {
      Log.logDependency("transforms.models", "ensureModelsAreDownloaded", success = true, currentTimeMillis() - startTime)
      Log.logDebug(s"Using previously downloaded model files from $previouslyDownloadedPath")
      return previouslyDownloadedPath
    }

    val remotePath = modelsUrlFromLanguage(language)
    if ((!remotePath.startsWith("http://") && !remotePath.startsWith("https://")) || !remotePath.endsWith(".zip")) {
      Log.logDependency("transforms.models", "ensureModelsAreDownloaded", success = false, currentTimeMillis() - startTime)
      throw new FileNotFoundException(s"Unable to process $remotePath, should be http(s) link to zip file")
    }

    val localDir = Try(downloadModels(remotePath)) match {
      case Success(path) =>
        path
      case Failure(ex) =>
        Log.logDependency("transforms.models", "ensureModelsAreDownloaded", success = false, currentTimeMillis() - startTime)
        throw ex
    }

    if (!hasModelFiles(localDir, language)) {
      Log.logDependency("transforms.models", "ensureModelsAreDownloaded", success = false, currentTimeMillis() - startTime)
      throw new FileNotFoundException(s"No models for language $language in $remotePath")
    }

    modelDirectories.putIfAbsent(language, localDir)
    Log.logDependency("transforms.models", "ensureModelsAreDownloaded", success = true, currentTimeMillis() - startTime)
    localDir
  }

  private def downloadModels(remotePath: String): String = {
    val localFile = Files.createTempFile(getClass.getSimpleName, ".zip").toAbsolutePath.toString
    val localDir = Files.createTempDirectory(getClass.getSimpleName).toAbsolutePath.toString
    Log.logDebug(s"Starting to download models from $remotePath to $localFile")
    val exitCode = (new URL(remotePath) #> new File(localFile)).!
    Log.logDebug(s"Finished downloading models from $remotePath to $localFile")
    if (exitCode != 0) {
      throw new FileNotFoundException(s"Unable to download models from $remotePath")
    }
    new ZipFile(localFile).extractAll(localDir)
    new File(localFile).delete()
    localDir
  }

  private def hasModelFiles(modelsDir: String, language: String): Boolean = {
    if (modelsDir.isEmpty) return false

    val modelFiles = new File(modelsDir).listFiles
    modelFiles != null && modelFiles.exists(_.getName.startsWith(s"$language-"))
  }
}
