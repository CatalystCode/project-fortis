package com.microsoft.partnercatalyst.fortis.spark.streamwrappers.radio

import org.apache.spark.storage.StorageLevel
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

object RadioStreamUtils {
  def createStream(
    ssc: StreamingContext,
    radioUrl: String,
    audioType: String,
    locale: String,
    subscriptionKey: String,
    speechType: String,
    outputFormat: String,
    storageLevel: StorageLevel = StorageLevel.MEMORY_ONLY
  ): DStream[RadioTranscription] = {
    new RadioInputDStream(ssc, radioUrl, audioType, locale, subscriptionKey, speechType, outputFormat, storageLevel)
  }
}
