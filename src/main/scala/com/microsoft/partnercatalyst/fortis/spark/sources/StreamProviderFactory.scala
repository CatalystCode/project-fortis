package com.microsoft.partnercatalyst.fortis.spark.sources

import java.io.File

import com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories._
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.StreamProvider
import com.microsoft.partnercatalyst.fortis.spark.sources.streamwrappers.customevents.CustomEventsAdapter
import com.microsoft.partnercatalyst.fortis.spark.sources.streamwrappers.tadaweb.TadawebAdapter
import com.microsoft.partnercatalyst.fortis.spark.{Constants, Settings}

object StreamProviderFactory {
  def create()(implicit settings: Settings): StreamProvider = {
    import EventHubStreamFactory.utf8ToString
    val streamProvider = StreamProvider()
      .withFactories(
        List(
          new InstagramLocationStreamFactory,
          new InstagramTagStreamFactory
        )
      )
      .withFactories(
        List(
          new BingPageStreamFactory
        )
      )
      .withFactories(
        List(
          new RedditStreamFactory
        )
      )
      .withFactories(
        List(
          new RadioStreamFactory
        )
      )
      .withFactories(
        List(
          new TwitterStreamFactory
        )
      )
      .withFactories(
        List(
          new FacebookPageStreamFactory
        )
      )
      .withFactories(
        List(
          new FacebookCommentStreamFactory
        )
      )
      .withFactories(
        List(
          new EventHubStreamFactory("Tadaweb", TadawebAdapter.apply,
            new File(settings.progressDir, Constants.EventHubProgressDir).getPath)
        )
      )
      .withFactories(
        List(
          new EventHubStreamFactory("CustomEvents", CustomEventsAdapter.apply,
            new File(settings.progressDir, Constants.EventHubProgressDir).getPath)
        )
      )

    streamProvider
  }
}
