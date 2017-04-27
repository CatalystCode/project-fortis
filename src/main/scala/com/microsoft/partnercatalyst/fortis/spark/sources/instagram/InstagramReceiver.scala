package com.microsoft.partnercatalyst.fortis.spark.sources.instagram

import com.microsoft.partnercatalyst.fortis.spark.sources.instagram.client.InstagramClient
import com.microsoft.partnercatalyst.fortis.spark.sources.instagram.dto.Instagram
import com.microsoft.partnercatalyst.fortis.spark.sources.{PollingReceiver, Schedule}
import org.apache.spark.storage.StorageLevel
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.ReceiverInputDStream
import org.apache.spark.streaming.receiver.Receiver

class InstagramReceiver(
  client: InstagramClient,
  schedule: Schedule,
  storageLevel: StorageLevel = StorageLevel.MEMORY_ONLY,
  numWorkers: Int = 1
) extends PollingReceiver[Instagram](schedule, storageLevel, numWorkers) {

  @volatile private var lastIngestedEpoch = Long.MinValue

  override protected def poll(): Unit = {
    client
      .loadNewInstagrams()
      .filter(x => x.createdAtEpoch > lastIngestedEpoch)
      .foreach(x => {
        store(x)
        if (x.createdAtEpoch > lastIngestedEpoch) lastIngestedEpoch = x.createdAtEpoch
      })
  }
}

class InstagramDStream(
  _ssc: StreamingContext,
  client: InstagramClient,
  schedule: Schedule,
  storageLevel: StorageLevel = StorageLevel.MEMORY_ONLY,
  numWorkers: Int = 1
) extends ReceiverInputDStream[Instagram](_ssc) {

  override def getReceiver(): Receiver[Instagram] = {
    new InstagramReceiver(client, schedule, storageLevel, numWorkers)
  }
}
