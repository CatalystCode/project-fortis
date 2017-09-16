package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.github.catalystcode.fortis.spark.streaming.rss._
import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.ConnectorConfig
import org.apache.spark.storage.StorageLevel
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

class RSSStreamFactory extends StreamFactoryBase[RSSEntry] with Loggable {

  override protected def canHandle(connectorConfig: ConnectorConfig): Boolean = {
    connectorConfig.name.equalsIgnoreCase("RSS")
  }

  override protected def buildStream(ssc: StreamingContext, connectorConfig: ConnectorConfig): DStream[RSSEntry] = {
    val params = connectorConfig.parameters
    connectorConfig.parameters.get("feedUrls") match {
      case Some(feedUrls:String) => {
        val urls = feedUrls.split("[|]")
        new RSSInputDStream(
          urls,
          storageLevel = StorageLevel.MEMORY_ONLY,
          requestHeaders = Map(
            "User-Agent" -> params.getOrElse("userAgent", "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36").toString
          ),
          connectTimeout = params.getOrElse("connectTimeout", "1000").toString.toInt,
          readTimeout = params.getOrElse("readTimeout", "3000").toString.toInt,
          pollingPeriodInSeconds = params.getOrElse("pollingPeriodInSeconds", "10").toString.toInt,
          ssc = ssc
        )
      }
      case _ => {
        throw new Exception("No feedUrls present for RSS feed stream $connectorConfig.")
      }
    }
  }

}

import org.apache.spark.storage.StorageLevel
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.ReceiverInputDStream
import org.apache.spark.streaming.receiver.Receiver

class RSSInputDStream(feedURLs: Seq[String],
                      requestHeaders: Map[String, String],
                      ssc: StreamingContext,
                      storageLevel: StorageLevel,
                      connectTimeout: Int = 1000,
                      readTimeout: Int = 1000,
                      pollingPeriodInSeconds: Int = 60)
  extends ReceiverInputDStream[RSSEntry](ssc) {

  override def getReceiver(): Receiver[RSSEntry] = {
    logDebug("Creating RSS receiver")
    new RSSReceiver(feedURLs, requestHeaders, storageLevel, connectTimeout, readTimeout, pollingPeriodInSeconds)
  }

}

import java.util.concurrent.{ScheduledThreadPoolExecutor, TimeUnit}

import org.apache.spark.storage.StorageLevel
import org.apache.spark.streaming.receiver.Receiver

private[streamfactories] class RSSReceiver(feedURLs: Seq[String],
                               requestHeaders: Map[String, String],
                               storageLevel: StorageLevel,
                               connectTimeout: Int = 1000,
                               readTimeout: Int = 1000,
                               pollingPeriodInSeconds: Int = 60)
  extends Receiver[RSSEntry](storageLevel) with Logger {

  @volatile private[streamfactories] var source = new RSSSource(feedURLs, requestHeaders, connectTimeout, readTimeout)

  @volatile private var executor: ScheduledThreadPoolExecutor = _

  def onStart(): Unit = {
    source.reset()
    executor = new ScheduledThreadPoolExecutor(1)

    // Make sure the polling period does not exceed 1 request per second.
    val normalizedPollingPeriod = Math.max(1, pollingPeriodInSeconds)

    executor.scheduleAtFixedRate(new Thread("Polling thread") {
      override def run(): Unit = {
        poll()
      }
    }, 1, normalizedPollingPeriod, TimeUnit.SECONDS)

  }

  def onStop(): Unit = {
    if (executor != null) {
      executor.shutdown()
    }
    source.reset()
  }

  private[streamfactories] def poll(): Unit = {
    try {
      println("Fetching entries...")
      source.fetchEntries().foreach(entry=>{
        println("Storying entry...")
        store(entry)
      })
      println("Entries fetched.")
    } catch {
      case e: Exception => {
        logError("Unable to fetch RSS entries.", e)
      }
    }
  }

}

import java.net.URL
import java.util.Date

import com.rometools.rome.feed.synd.SyndFeed
import com.rometools.rome.io.{SyndFeedInput, XmlReader}

import scala.collection.JavaConversions._
import scala.collection.mutable

private[streamfactories] class RSSSource(feedURLs: Seq[String],
                                         requestHeaders: Map[String, String],
                                         connectTimeout: Int = 1000,
                                         readTimeout: Int = 1000) extends Serializable {

  private[streamfactories] var lastIngestedDates = mutable.Map[String, Long]()

  def reset(): Unit = {
    lastIngestedDates.clear()
    feedURLs.foreach(url=>{
      lastIngestedDates.put(url, Long.MinValue)
    })
  }

  def fetchEntries(): Seq[RSSEntry] = {
    fetchFeeds()
      .filter(_.isDefined)
      .flatMap(optionPair=>{
        val url = optionPair.get._1
        val feed = optionPair.get._2

        val source = RSSFeed(
          feedType = feed.getFeedType,
          uri = feed.getUri,
          title = feed.getTitle,
          description = feed.getDescription,
          link = feed.getLink
        )

        feed.getEntries
          .filter(entry=>{
            val date = Math.max(safeDateGetTime(entry.getPublishedDate), safeDateGetTime(entry.getUpdatedDate))
            lastIngestedDates.get(url).isEmpty || date > lastIngestedDates(url)
          })
          .map(feedEntry=>{
            val entry = RSSEntry(
              source = source,
              uri = feedEntry.getUri,
              title = feedEntry.getTitle,
              links = feedEntry.getLinks.map(l => RSSLink(href = l.getHref, title = l.getTitle)).toList,
              content = feedEntry.getContents.map(c => RSSContent(contentType = c.getType, mode = c.getMode, value = c.getValue)).toList,
              description = feedEntry.getDescription match {
                case null => null
                case d => RSSContent(
                  contentType = d.getType,
                  mode = d.getMode,
                  value = d.getValue
                )
              },
              enclosures = feedEntry.getEnclosures.map(e => RSSEnclosure(url = e.getUrl, enclosureType = e.getType, length = e.getLength)).toList,
              publishedDate = safeDateGetTime(feedEntry.getPublishedDate),
              updatedDate = safeDateGetTime(feedEntry.getUpdatedDate),
              authors = feedEntry.getAuthors.map(a => RSSPerson(name = a.getName, uri = a.getUri, email = a.getEmail)).toList,
              contributors = feedEntry.getContributors.map(c => RSSPerson(name = c.getName, uri = c.getUri, email = c.getEmail)).toList
            )
            markStored(entry, url)
            entry
          })
      })
  }

  private[streamfactories] def fetchFeeds(): Seq[Option[(String, SyndFeed)]] = {
    feedURLs.map(url=>{
      try {
        val connection = new URL(url).openConnection()
        connection.setConnectTimeout(connectTimeout)
        connection.setReadTimeout(readTimeout)
        val reader = new XmlReader(connection, requestHeaders)
        val feed = new SyndFeedInput().build(reader)
        Some((url, feed))
      } catch {
        case e: Exception => {
          println(s"Unable to fetch feed for ${url}")
          e.printStackTrace()
          None
        }
      }
    })
  }

  private def markStored(entry: RSSEntry, url: String): Unit = {
    val date = entry.updatedDate match {
      case 0 => entry.publishedDate
      case _ => entry.updatedDate
    }
    lastIngestedDates.get(url) match {
      case Some(lastIngestedDate) => if (date > lastIngestedDate) {
        lastIngestedDates.put(url, date)
      }
      case None => lastIngestedDates.put(url, date)
    }
  }

  private def safeDateGetTime(date: Date): Long = {
    Option(date).map(_.getTime).getOrElse(0)
  }

}
