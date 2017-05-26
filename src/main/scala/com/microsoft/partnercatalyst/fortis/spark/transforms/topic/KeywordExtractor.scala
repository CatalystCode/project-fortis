package com.microsoft.partnercatalyst.fortis.spark.transforms.topic

import com.microsoft.partnercatalyst.fortis.spark.transforms.Tag
import org.apache.commons.collections4.trie.PatriciaTrie

import scala.collection.mutable.ListBuffer

@SerialVersionUID(100L)
class KeywordExtractor(keyWords: Seq[String]) extends Serializable {
  private val wordTokenizer = """\b""".r
  private val keywordTrie = new PatriciaTrie[Unit]()
  private val originalCase = Map[String, String](keyWords.map(s => (s.toLowerCase, s)): _*)

  originalCase.keys.foreach(keywordTrie.put(_, ()))

  def extractKeywords(text: String): List[Tag] = {

    def findMatches(segment: Seq[String]): Iterable[String] = {
      val sb = new StringBuilder()
      val result = ListBuffer[String]()

      val it = segment.iterator
      var prefix = ""
      while (it.hasNext && !keywordTrie.prefixMap(prefix).isEmpty) {
        prefix = sb.append(it.next()).mkString

        if (keywordTrie.containsKey(prefix)) {
          result.append(originalCase(prefix))
        }
      }

      result
    }

    val tokens = wordTokenizer.split(text.toLowerCase).toSeq
    tokens.tails.flatMap(findMatches(_).map(Tag(_, 1))).toList
  }
}