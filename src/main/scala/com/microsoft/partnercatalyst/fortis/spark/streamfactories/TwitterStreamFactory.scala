package com.microsoft.partnercatalyst.fortis.spark.streamfactories

import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamFactory}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream
import org.apache.spark.streaming.twitter.TwitterUtils
import twitter4j.Status
import twitter4j.auth.OAuthAuthorization
import twitter4j.conf.ConfigurationBuilder

class TwitterStreamFactory extends StreamFactory[Status] {
  override def createStream(streamingContext: StreamingContext): PartialFunction[ConnectorConfig, DStream[Status]] = {
    case ConnectorConfig("Twitter", params) =>
      val auth = new OAuthAuthorization(
        new ConfigurationBuilder()
          .setOAuthConsumerKey(params("consumerKey"))
          .setOAuthConsumerSecret(params("consumerSecret"))
          .setOAuthAccessToken(params("accessToken"))
          .setOAuthAccessTokenSecret(params("accessTokenSecret"))
          .build()
      )

      TwitterUtils.createStream(
        streamingContext,
        twitterAuth = Some(auth),
        filters = Seq(/*"coffee", "tea", "drink", "beverage", "cup"*/))
  }
}
