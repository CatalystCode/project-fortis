package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories.TwitterStreamFactory._
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.{ConnectorConfig, StreamFactory}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream
import org.apache.spark.streaming.twitter.TwitterUtils
import twitter4j.auth.OAuthAuthorization
import twitter4j.conf.ConfigurationBuilder
import twitter4j.{FilterQuery, Status}

class TwitterStreamFactory extends StreamFactoryBase[Status] with Loggable {
  override protected def canHandle(connectorConfig: ConnectorConfig): Boolean = {
    connectorConfig.name == "Twitter"
  }

  override protected def buildStream(ssc: StreamingContext, connectorConfig: ConnectorConfig): DStream[Status] = {
    import ParameterExtensions._

    val params = connectorConfig.parameters
    val auth = new OAuthAuthorization(
      new ConfigurationBuilder()
        .setOAuthConsumerKey(params.getAs[String]("consumerKey"))
        .setOAuthConsumerSecret(params.getAs[String]("consumerSecret"))
        .setOAuthAccessToken(params.getAs[String]("accessToken"))
        .setOAuthAccessTokenSecret(params.getAs[String]("accessTokenSecret"))
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
      ssc,
      twitterAuth = Some(auth),
      query = Some(query))
  }

  private def addKeywords(query: FilterQuery, params: Map[String, Any]): Boolean = {
    parseKeywords(params) match {
      case Some(keywords) =>
        query.track(keywords:_*)
        true
      case None =>
        false
    }
  }

  private def addUsers(query: FilterQuery, params: Map[String, Any]): Boolean = {
    parseUserIds(params) match {
      case Some(userIds) =>
        query.follow(userIds:_*)
        true
      case None =>
        false
    }
  }

  private def addLanguages(query: FilterQuery, params: Map[String, Any]): Boolean = {
    parseLanguages(params) match {
      case Some(languages) =>
        query.language(languages:_*)
        true
      case None =>
        false
    }
  }

  private def addLocations(query: FilterQuery, params: Map[String, Any]): Boolean = {
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
  def parseLocations(params: Map[String, Any]): Option[Array[Array[Double]]] = {
    parseList(params, "locations").map(_.map(_.split(','))) match {
      case None => None
      case Some(locations) if locations.exists(_.length != 4) => None
      case Some(locations) => Some(locations.map(_.map(_.toDouble)))
    }
  }

  def parseLanguages(params: Map[String, Any]): Option[Array[String]] = parseList(params, "languages")
  def parseUserIds(params: Map[String, Any]): Option[Array[Long]] = parseList(params, "userIds").map(_.map(_.toLong))
  def parseKeywords(params: Map[String, Any]): Option[Array[String]] = parseList(params, "keywords")

  private def parseList(params: Map[String, Any], key: String): Option[Array[String]] = params.get(key).map(_.asInstanceOf[String].split('|'))
}
