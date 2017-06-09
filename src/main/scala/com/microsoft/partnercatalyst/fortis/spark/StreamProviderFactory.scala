package com.microsoft.partnercatalyst.fortis.spark

import java.io.File

import com.microsoft.partnercatalyst.fortis.spark.streamfactories.adapters.TadawebAdapter
import com.microsoft.partnercatalyst.fortis.spark.streamfactories._
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.StreamProvider

object StreamProviderFactory {
  def create()(implicit environment: Environment): StreamProvider = {
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
            new File(environment.progressDir, Constants.EventHubProgressDir).getPath)
        )
      )

    streamProvider
  }
}
