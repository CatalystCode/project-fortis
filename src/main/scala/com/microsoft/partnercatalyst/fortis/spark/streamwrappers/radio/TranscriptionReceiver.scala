package com.microsoft.partnercatalyst.fortis.spark.streamwrappers.radio

import java.io.InputStream
import java.net.URL
import java.util.Locale

import com.github.catalystcode.fortis.speechtotext.Transcriber
import com.github.catalystcode.fortis.speechtotext.config.{OutputFormat, SpeechServiceConfig, SpeechType}
import com.github.catalystcode.fortis.speechtotext.utils.Func
import org.apache.spark.storage.StorageLevel
import org.apache.spark.streaming.receiver.Receiver

class TranscriptionReceiver(
  radioUrl: String,
  audioType: String,
  locale: String,
  subscriptionKey: String,
  speechType: String,
  outputFormat: String,
  storageLevel: StorageLevel
) extends Receiver[RadioTranscription](storageLevel) {

  private val language = new Locale(locale).getLanguage
  private var audioStream: InputStream = _
  private var transcriber: Transcriber = _

  private lazy val onTranscription = new Func[String] {
    override def call(text: String): Unit = {
      val transcription = RadioTranscription(text = text, language = language, radioUrl = radioUrl)
      store(transcription)
    }
  }

  private lazy val onHypothesis = new Func[String] {
    override def call(text: String): Unit = {
      // do nothing
    }
  }

  override def onStart(): Unit = {
    val config = new SpeechServiceConfig(
      subscriptionKey,
      SpeechType.valueOf(speechType),
      OutputFormat.valueOf(outputFormat),
      new Locale(locale))

    transcriber = Transcriber.create(audioType, config)
    audioStream = new URL(radioUrl).openConnection.getInputStream
    transcriber.transcribe(audioStream, onTranscription, onHypothesis)
  }

  override def onStop(): Unit = {
    if (audioStream != null) audioStream.close()
    if (transcriber != null) transcriber = null
  }
}
