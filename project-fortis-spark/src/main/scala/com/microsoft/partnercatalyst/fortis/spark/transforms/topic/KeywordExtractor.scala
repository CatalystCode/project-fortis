package com.microsoft.partnercatalyst.fortis.spark.transforms.topic

import com.microsoft.partnercatalyst.fortis.spark.dto.Tag
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.TextNormalizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.nlp.Tokenizer
import org.apache.commons.collections4.trie.PatriciaTrie

import scala.collection.mutable.ListBuffer

@SerialVersionUID(100L)
class KeywordExtractor(language: String, keywords: Iterable[String], maxKeywords: Int = Int.MaxValue) extends Serializable {
  @transient private lazy val keywordTrie = initializeTrie(keywords)

  def extractKeywords(text: String): List[Tag] = {
    if (text.isEmpty) {
      return List()
    }

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

    val tokens = Tokenizer(TextNormalizer(text.toLowerCase, language))
    val occurances = tokens.tails.flatMap(findMatches(_).map(Tag(_, confidence = None))).toIterable.groupBy(_.name.toLowerCase)
    occurances.toSeq.sortBy(_._2.size)(Ordering[Int].reverse).take(maxKeywords).map(_._2.head).toList
  }

  private def initializeTrie(keywords: Iterable[String]): PatriciaTrie[String] = {
    val trie = new PatriciaTrie[String]()
    keywords.foreach(k => {
      trie.put(k.toLowerCase, k)
      trie.put(TextNormalizer(k.toLowerCase, language), k)
    })

    trie
  }
}