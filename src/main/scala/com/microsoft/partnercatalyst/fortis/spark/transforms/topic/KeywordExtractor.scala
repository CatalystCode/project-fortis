package com.microsoft.partnercatalyst.fortis.spark.transforms.topic

import com.microsoft.partnercatalyst.fortis.spark.transforms.Tag
import org.apache.commons.collections4.trie.PatriciaTrie

import scala.collection.mutable.ListBuffer

@SerialVersionUID(100L)
class KeywordExtractor(keywords: Seq[String]) extends Serializable {
  @transient private lazy val wordTokenizer = """\b""".r
  @transient private lazy val keywordTrie = initializeTrie(keywords)

  def extractKeywords(text: String): List[Tag] = {

    def findMatches(segment: Seq[String]): Iterable[String] = {
      val sb = new StringBuilder()
      val result = ListBuffer[String]()

      val it = segment.iterator
      var prefix = ""
      while (it.hasNext && !keywordTrie.prefixMap(prefix).isEmpty) {
        prefix = sb.append(it.next()).mkString

        Option(keywordTrie.get(prefix)).foreach(result.append(_))
      }

      result
    }

    val tokens = wordTokenizer.split(text.toLowerCase).toSeq
    tokens.tails.flatMap(findMatches(_).map(Tag(_, 1))).toList
  }

  private def initializeTrie(keywords: Seq[String]): PatriciaTrie[String] = {
    val trie = new PatriciaTrie[String]()
    keywords.foreach(k => trie.put(k.toLowerCase, k))

    trie
  }
}