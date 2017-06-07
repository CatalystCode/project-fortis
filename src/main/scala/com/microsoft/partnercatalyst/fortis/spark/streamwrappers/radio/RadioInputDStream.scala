package com.microsoft.partnercatalyst.fortis.spark.streamwrappers.radio

import org.apache.spark.storage.StorageLevel
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.ReceiverInputDStream
import org.apache.spark.streaming.receiver.Receiver

class RadioInputDStream(
  ssc: StreamingContext,
  radioUrl: String,
  audioType: String,
  locale: String,
  subscriptionKey: String,
  speechType: String,
  outputFormat: String,
  storageLevel: StorageLevel
) extends ReceiverInputDStream[RadioTranscription](ssc) {
  override def getReceiver(): Receiver[RadioTranscription] = {
    logDebug("Creating radio transcription receiver")
    new TranscriptionReceiver(radioUrl, audioType, locale, subscriptionKey, speechType, outputFormat, storageLevel)
  }
}
