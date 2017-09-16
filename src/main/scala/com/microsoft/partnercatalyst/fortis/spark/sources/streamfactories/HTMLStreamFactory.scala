package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.github.catalystcode.fortis.spark.streaming.html._
import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.ConnectorConfig
import org.apache.spark.storage.StorageLevel
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

import scala.collection.mutable

class HTMLStreamFactory extends StreamFactoryBase[HTMLPage] with Loggable {

  override protected def canHandle(connectorConfig: ConnectorConfig): Boolean = {
    connectorConfig.name.equalsIgnoreCase("HTML")
  }

  override protected def buildStream(ssc: StreamingContext, connectorConfig: ConnectorConfig): DStream[HTMLPage] = {
    val params = connectorConfig.parameters
    connectorConfig.parameters.get("feedUrls") match {
      case Some(feedUrls:String) => {
        val urls = feedUrls.split("[|]")
        new HTMLInputDStream(
          urls,
          ssc,
          storageLevel = StorageLevel.MEMORY_ONLY_SER,
          requestHeaders = Map(
            "User-Agent" -> params.getOrElse("userAgent", "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36").toString
          ),
          maxDepth = params.getOrElse("maxDepth", "1").toString.toInt,
          pollingPeriodInSeconds = 15,
          cacheEditDistanceThreshold = params.getOrElse("cacheEditDistanceThreshold", "0.0001").toString.toDouble
        )
      }
      case _ => {
        throw new Exception("No feedUrls present for HTML feed stream $connectorConfig.")
      }
    }
  }

}


import java.net.URL
import java.util.concurrent.{ScheduledThreadPoolExecutor, TimeUnit}

import org.apache.spark.storage.StorageLevel
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.ReceiverInputDStream
import org.apache.spark.streaming.receiver.Receiver
import org.apache.spark.unsafe.types.UTF8String
import org.jsoup.Jsoup
import org.jsoup.nodes.Document

import scala.collection.JavaConversions._

class HTMLInputDStream(siteURLs: Seq[String],
                       ssc: StreamingContext,
                       storageLevel: StorageLevel = StorageLevel.MEMORY_ONLY,
                       maxDepth: Int = 1,
                       requestHeaders: Map[String, String] = Map(),
                       pollingPeriodInSeconds: Int = 60,
                       cacheEditDistanceThreshold: Double = 0.10) extends ReceiverInputDStream[HTMLPage](ssc) {
  override def getReceiver(): Receiver[HTMLPage] = {
    new HTMLReceiver(
      siteURLs = siteURLs,
      storageLevel = storageLevel,
      maxDepth = maxDepth,
      requestHeaders = requestHeaders,
      pollingPeriodInSeconds = pollingPeriodInSeconds,
      cacheEditDistanceThreshold = cacheEditDistanceThreshold
    )
  }

}

class HTMLReceiver(siteURLs: Seq[String],
                   storageLevel: StorageLevel,
                   maxDepth: Int = 1,
                   pollingPeriodInSeconds: Int = 60,
                   requestHeaders: Map[String, String] = Map(),
                   cacheEditDistanceThreshold: Double = 0.10)
  extends Receiver[HTMLPage](storageLevel) with Logger {

  private val sources: Seq[HTMLSource] = siteURLs.map(url => new HTMLSource(url))
  @volatile private var executor: ScheduledThreadPoolExecutor = _

  override def onStart(): Unit = {
    executor = new ScheduledThreadPoolExecutor(2)

    // Make sure the polling period does not exceed 1 request per second.
    val normalizedPollingPeriod = Math.max(1, pollingPeriodInSeconds)

    executor.scheduleAtFixedRate(new Thread(s"${this.toString} polling thread") {
      override def run(): Unit = {
        poll()
      }
    }, 1, normalizedPollingPeriod, TimeUnit.SECONDS)

  }

  override def onStop(): Unit = {
    if (executor != null) {
      executor.shutdown()
    }
    sources.foreach(_.reset())
  }

  private[streamfactories] def poll(): Unit = {
    try {
      sources.foreach(source=>{
        val pages = source.fetch()
        store(pages.iterator)
      })
    } catch {
      case e: Exception => {
        e.printStackTrace()
      }
    }
  }

}

private[streamfactories] class HTMLSource(siteURL: String,
                               maxDepth: Int = 1,
                               requestHeaders: Map[String, String] = Map(),
                               cacheEditDistanceThreshold: Double = 0.10) extends Serializable with Logger {

  private val connectTimeoutMillis: Int = sys.env.getOrElse("HTML_SOURCE_CONNECT_TIMEOUT_MILLIS", "500").toInt
  private val cacheTimeMinutes: Int = sys.env.getOrElse("HTML_SOURCE_CACHE_TIME_MINUTES", "30").toInt

  private val cache = mutable.Map[String, Document]()

  def reset(): Unit = {
    cache.clear()
  }

  def fetch(): Seq[HTMLPage] = {
    val documentPairs = unfilteredDocuments()
    documentPairs
      .filter(pair=>{
        val url = pair._1
        val document = pair._2

        cache.get(url) match {
          case None => {
            cache.put(url, document)
            true
          }
          case Some(cachedDocument) => {
            val documentText = document.body().text() match {
              case null => UTF8String.EMPTY_UTF8
              case str => UTF8String.fromString(str)
            }
            val cachedDocumentText = cachedDocument.body().text() match {
              case null => UTF8String.EMPTY_UTF8
              case str => UTF8String.fromString(str)
            }
            val distance = documentText.levenshteinDistance(cachedDocumentText)
            val totalCharCount = documentText.numChars() + cachedDocumentText.numChars()
            val distanceAsPercentageOfTotalCount = distance / totalCharCount.toDouble
            cache.put(url, document)
            distanceAsPercentageOfTotalCount > cacheEditDistanceThreshold
          }
          case _ => true
        }
      })
      .map(p => HTMLPage(p._1.toString, p._2.html()))
  }

  private val urlPattern = raw"http[s]?://.+".r
  private val rootPathPattern = raw"[/]+".r
  private val absolutePathPattern = raw"[/].+".r
  private val blankPattern = raw"\\s+".r

  private[streamfactories] def fetchDocument(url: URL): Option[Document] = {
    try {
      Some(Jsoup.parse(url, connectTimeoutMillis))
    } catch {
      case e: Exception => {
        logError(s"Unable to fetch document for $url", e)
        None
      }
    }
  }

  private[streamfactories] def unfilteredDocuments(): Seq[(String,Document)] = {
    val rootURL = new URL(siteURL)
    val rootHost = rootURL.getHost
    val rootPortString = rootURL.getPort match {
      case -1 => ""
      case _ => s":${rootURL.getPort}"
    }

    fetchDocument(rootURL) match {
      case None => Seq()
      case Some(rootDocument) => {
        if (maxDepth < 1) {
          return Seq((siteURL, rootDocument))
        }

        val childURLs: Seq[URL] = Option(rootDocument.select("a[href]")) match {
          case None => Seq()
          case Some(anchors) => anchors
            .filter(a=>a.hasText && a.hasAttr("href"))
            .map(a=>{
              val href = a.attr("href")
              try {
                val url = href match {
                  case urlPattern() => new URL(href)
                  case rootPathPattern() => rootURL
                  case blankPattern() => rootURL
                  case absolutePathPattern() => new URL(s"${rootURL.getProtocol}://$rootHost$rootPortString$href")
                  case _ => new URL(s"$siteURL/$href")
                }
                Some(url)
              } catch {
                case e: Exception => None
              }
            })
            .filter(d=>d.isDefined)
            .map(d=>d.get)
        }
        val childDocuments = childURLs.map(childURL => {
          if (childURL == rootURL) {
            None
          } else if (childURL.getHost != rootHost) {
            None
          }
          else {
            fetchDocument(childURL) match {
              case None => None
              case Some(childDocument) => Some[(String, Document)](childURL.toString, childDocument)
            }
          }
        }).filter(d=>d.isDefined).map(d=>d.get)
        Seq((siteURL, rootDocument)) ++ childDocuments
      }
    }
  }

  override def toString: String = s"${super.toString}(${this.siteURL})"

}
