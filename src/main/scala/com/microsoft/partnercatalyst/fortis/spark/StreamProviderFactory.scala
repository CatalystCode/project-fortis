package com.microsoft.partnercatalyst.fortis.spark

import java.io.File

import com.microsoft.partnercatalyst.fortis.spark.streamfactories._
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.StreamProvider
import com.microsoft.partnercatalyst.fortis.spark.streamwrappers.tadaweb.TadawebAdapter

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
          new EventHubStreamFactory("Tadaweb", TadawebAdapter.apply,
            new File(settings.progressDir, Constants.EventHubProgressDir).getPath)
        )
      )

    streamProvider
  }
}
