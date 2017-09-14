package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import java.net.URL
import java.util.Date

import com.github.catalystcode.fortis.spark.streaming.rss._
import com.rometools.rome.feed.synd.SyndFeed
import com.rometools.rome.io.{SyndFeedInput, XmlReader}
import org.apache.spark.rdd.RDD
import org.apache.spark.storage.StorageLevel
import org.apache.spark.streaming.dstream.InputDStream
import org.apache.spark.streaming.{StreamingContext, Time}

import scala.collection.JavaConversions._
import scala.collection.mutable

class RSSLiveStream(feedURLs: Seq[URL],
                    ssc: StreamingContext,
                    storageLevel: StorageLevel) extends InputDStream[RSSEntry](ssc) {

  @volatile private var lastIngestedDates = mutable.Map[URL, Long]()

  override def start(): Unit = {
    lastIngestedDates.clear()
    feedURLs.foreach(url=>{
      lastIngestedDates.put(url, Long.MinValue)
    })
    println(s"Started ${this}")
  }

  override def stop(): Unit = {
    lastIngestedDates.clear()
    println(s"Stopped ${this}")
  }

  override def compute(validTime: Time): Option[RDD[RSSEntry]] = {
    Some(this.context.sparkContext.parallelize(
      fetchFeeds().filter(_.isDefined).flatMap(optionPair=>{
        val url = optionPair.get._1
        val feed = optionPair.get._2

        val source = RSSFeed(
          feedType = feed.getFeedType,
          uri = feed.getUri,
          title = feed.getTitle,
          description = feed.getDescription,
          link = feed.getLink
        )

        feed.getEntries.filter(entry=>{
            val date = Math.max(safeDateGetTime(entry.getPublishedDate), safeDateGetTime(entry.getUpdatedDate))
            logDebug(s"Received RSS entry ${entry.getUri} from date $date")
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
    ))
  }

  private def fetchFeeds(): Seq[Option[(URL, SyndFeed)]] = {
    feedURLs.map(url=>{
      try {
        val reader = new XmlReader(url)
        val feed = new SyndFeedInput().build(reader)
        Some((url, feed))
      } catch {
        case e: Exception => {
          logError(s"Unable to open feed for $url", e)
          None
        }
      }
    })
  }

  private def markStored(entry: RSSEntry, url: URL): Unit = {
    val date = entry.updatedDate match {
      case 0 => entry.publishedDate
      case _ => entry.updatedDate
    }
    lastIngestedDates.get(url) match {
      case Some(lastIngestedDate) =>
        if (date > lastIngestedDate) {
          logDebug(s"Updating last ingested date to $date")
          lastIngestedDates.put(url, date)
        }
      case None => {
        logDebug(s"Updating last ingested date to $date")
        lastIngestedDates.put(url, date)
      }
    }
  }

  private def safeDateGetTime(date: Date): Long = {
    Option(date).map(_.getTime).getOrElse(0)
  }

}
