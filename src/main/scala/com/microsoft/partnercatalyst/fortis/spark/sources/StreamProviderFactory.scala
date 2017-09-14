package com.microsoft.partnercatalyst.fortis.spark.sources

import java.io.File

import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories._
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.StreamProvider
import com.microsoft.partnercatalyst.fortis.spark.sources.streamwrappers.customevents.CustomEventsAdapter
import com.microsoft.partnercatalyst.fortis.spark.sources.streamwrappers.tadaweb.TadawebAdapter
import com.microsoft.partnercatalyst.fortis.spark.{Constants, FortisSettings}

object StreamProviderFactory {
  def create(configurationManager: ConfigurationManager)(implicit settings: FortisSettings): StreamProvider = {
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
          new RSSStreamFactory
        )
      )
      .withFactories(
        List(
          new TwitterStreamFactory(configurationManager)
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
