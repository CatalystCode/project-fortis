package com.microsoft.partnercatalyst.fortis.spark.transforms.topic

import org.apache.commons.collections4.trie.PatriciaTrie
import org.apache.lucene.analysis.Analyzer
import org.apache.lucene.analysis.ar.ArabicAnalyzer
import org.apache.lucene.analysis.de.GermanAnalyzer
import org.apache.lucene.analysis.en.EnglishAnalyzer
import org.apache.lucene.analysis.es.SpanishAnalyzer
import org.apache.lucene.analysis.fr.FrenchAnalyzer
import org.apache.lucene.analysis.hi.HindiAnalyzer
import org.apache.lucene.analysis.pt.PortugueseAnalyzer
import org.apache.lucene.analysis.ru.RussianAnalyzer
import org.apache.lucene.analysis.standard.StandardAnalyzer
import org.apache.lucene.analysis.tokenattributes.{CharTermAttribute, OffsetAttribute}

import scala.collection.mutable

class LuceneKeyphraseExtractor(language: String, keyphrases: Set[String], maxKeywords: Int = Int.MaxValue) extends KeyphraseExtractor {

  private val analyzer: Analyzer = LuceneKeyphraseExtractor.analyzersByLanguage.getOrElse(language, new StandardAnalyzer())
  private val keyphraseTries = LuceneKeyphraseExtractor.createTries(analyzer, keyphrases)

  override def extractKeyphrases(text: String): Set[Keyphrase] = {
    val tokenStream = analyzer.tokenStream(null, text)
    try {
      val collectors = keyphraseTries.map(kv=>{
        KeyphraseCollector(kv._1, kv._2)
      })

      tokenStream.reset()
      while (tokenStream.incrementToken()) {
        val stemTerm = tokenStream.getAttribute(classOf[CharTermAttribute]).toString
        val offset = tokenStream.getAttribute(classOf[OffsetAttribute])

        collectors.foreach(window=>{
          window.collect(stemTerm, offset, text)
        })
      }

      collectors.flatMap(_.getKeyphrases()).toList.sortBy(_.count)(Ordering[Int].reverse).take(maxKeywords).toSet
    }
    finally {
      tokenStream.close()
    }
  }

}

object LuceneKeyphraseExtractor{

  // TODO: Find an existing mapping mechanism for this.
  val analyzersByLanguage: Map[String, Analyzer] = Map(
    "ar"->new ArabicAnalyzer(),
    "de"->new GermanAnalyzer(),
    "en"->new EnglishAnalyzer(),
    "es"->new SpanishAnalyzer(),
    "fr"->new FrenchAnalyzer(),
    "hi"->new HindiAnalyzer(),
    "pt"->new PortugueseAnalyzer(),
    "ru"->new RussianAnalyzer()
  )

  def createTries(analyzer: Analyzer, keyphrases: Set[String]): Map[Int, PatriciaTrie[String]] = {
    val result = mutable.Map[Int, PatriciaTrie[String]]()
    keyphrases.foreach(k => {
      val tokens = collectTokens(analyzer, k)
      val normalized = tokens.mkString(" ")
      result.get(tokens.size) match {
        case None => {
          val trie = new PatriciaTrie[String]()
          trie.put(normalized, k)
          result.put(tokens.size, trie)
        }
        case Some(trie) => {
          trie.put(normalized, k)
        }
      }
    })
    result.toMap
  }

  def collectTokens(analyzer: Analyzer, phrase: String): Seq[String] = {
    val stream = analyzer.tokenStream(null, phrase)
    try {
      stream.reset()
      val components = mutable.ListBuffer[String]()
      while (stream.incrementToken()) {
        val stemTerm = stream.getAttribute(classOf[CharTermAttribute]).toString
        components += stemTerm
      }
      components
    }
    finally {
      stream.close()
    }
  }

}

private case class KeyphraseCollector(size: Int, keyphraseTrie: PatriciaTrie[String]) {

  private val tokenWindow = mutable.ListBuffer[String]()
  private val items = mutable.Map[String, Keyphrase]()

  def collect(stem: String, offsetAttribute: OffsetAttribute, text: String): Unit = {
    this.addToTokenWindow(stem)
    if (tokenWindow.size != size) {
      return
    }

    val key = tokenWindow.mkString(" ")
    val record = keyphraseTrie.get(key)
    if (record != null) {
      val originalString = text.substring(offsetAttribute.startOffset(), offsetAttribute.endOffset())
      items.get(record) match {
        case None => {
          items.put(record, Keyphrase(record, Set(originalString), 1))
        }
        case Some(keyphrase) => {
          val updatedFragments = keyphrase.fragments ++ Set(originalString)
          val updatedCount = keyphrase.count + 1
          items.put(record, keyphrase.copy(count = updatedCount, fragments = updatedFragments))
        }
      }
    }
  }

  def getKeyphrases(): Seq[Keyphrase] = {
    items.map(kv=>kv._2).toSeq
  }

  private def addToTokenWindow(value: String): Unit = {
    tokenWindow += value
    while (tokenWindow.size > size) {
      tokenWindow.remove(0)
    }
  }

}