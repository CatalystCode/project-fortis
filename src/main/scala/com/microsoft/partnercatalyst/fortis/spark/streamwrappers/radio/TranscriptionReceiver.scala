package com.microsoft.partnercatalyst.fortis.spark.streamwrappers.radio

import java.io.InputStream
import java.net.URL
import java.util.Locale
import java.util.function.Consumer

import com.github.catalystcode.fortis.speechtotext.Transcriber
import com.github.catalystcode.fortis.speechtotext.config.{OutputFormat, SpeechServiceConfig, SpeechType}
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

  private val onTranscription = new Consumer[String] {
    override def accept(text: String): Unit = {
      val transcription = RadioTranscription(text = text, language = language, radioUrl = radioUrl)
      store(transcription)
    }
  }

  private val onHypothesis = new Consumer[String] {
    override def accept(hypothesis: String): Unit = {
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
