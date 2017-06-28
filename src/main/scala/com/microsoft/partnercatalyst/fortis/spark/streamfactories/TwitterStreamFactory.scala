package com.microsoft.partnercatalyst.fortis.spark.streamfactories

import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.streamfactories.TwitterStreamFactory._
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamFactory}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream
import org.apache.spark.streaming.twitter.TwitterUtils
import twitter4j.auth.OAuthAuthorization
import twitter4j.conf.ConfigurationBuilder
import twitter4j.{FilterQuery, Status}

class TwitterStreamFactory extends StreamFactory[Status] with Loggable {
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

      val query = new FilterQuery
      val hasQuery =
        addKeywords(query, params) ||
        addUsers(query, params) ||
        addLanguages(query, params) ||
        addLocations(query, params)

      if (!hasQuery) {
        logInfo("No filter set for Twitter stream")
      }

      TwitterUtils.createFilteredStream(
        streamingContext,
        twitterAuth = Some(auth),
        query = Some(query))
  }

  private def addKeywords(query: FilterQuery, params: Map[String, String]): Boolean = {
    parseKeywords(params) match {
      case Some(keywords) =>
        query.track(keywords:_*)
        true
      case None =>
        false
    }
  }

  private def addUsers(query: FilterQuery, params: Map[String, String]): Boolean = {
    parseUserIds(params) match {
      case Some(userIds) =>
        query.follow(userIds:_*)
        true
      case None =>
        false
    }
  }

  private def addLanguages(query: FilterQuery, params: Map[String, String]): Boolean = {
    parseLanguages(params) match {
      case Some(languages) =>
        query.language(languages:_*)
        true
      case None =>
        false
    }
  }

  private def addLocations(query: FilterQuery, params: Map[String, String]): Boolean = {
    parseLocations(params) match {
      case Some(locations) =>
        query.locations(locations:_*)
        true
      case None =>
        false
    }
  }
}

object TwitterStreamFactory {
  def parseLocations(params: Map[String, String]): Option[Array[Array[Double]]] = {
    parseList(params, "locations").map(_.map(_.split(','))) match {
      case None => None
      case Some(locations) if locations.exists(_.length != 4) => None
      case Some(locations) => Some(locations.map(_.map(_.toDouble)))
    }
  }

  def parseLanguages(params: Map[String, String]): Option[Array[String]] = parseList(params, "languages")
  def parseUserIds(params: Map[String, String]): Option[Array[Long]] = parseList(params, "userIds").map(_.map(_.toLong))
  def parseKeywords(params: Map[String, String]): Option[Array[String]] = parseList(params, "keywords")

  private def parseList(params: Map[String, String], key: String): Option[Array[String]] = params.get(key).map(_.split('|'))
}
