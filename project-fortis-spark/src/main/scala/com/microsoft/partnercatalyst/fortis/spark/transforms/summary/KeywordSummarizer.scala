package com.microsoft.partnercatalyst.fortis.spark.transforms.summary

import com.google.common.base.Strings.isNullOrEmpty
import com.microsoft.partnercatalyst.fortis.spark.transforms.nlp.Tokenizer

trait Summarizer extends Serializable {
  def summarize(text: String): Option[String]
}

object KeywordSummarizer {
  def createSummary(keyword: String, keywordIndexInWords: Int, words: List[String], maxLeft: Int, maxLength: Int): String = {
    var leftSummaryLength = 0
    val leftSummary = words.take(keywordIndexInWords).reverse.takeWhile(word => {
      val canFit = leftSummaryLength + word.length < maxLeft
      leftSummaryLength += word.length
      canFit
    }).reverse.mkString("").trim()

    var rightSummaryLength = leftSummary.length
    val rightSummary = words.drop(keywordIndexInWords).takeWhile(word => {
      val canFit = rightSummaryLength + word.length < maxLength
      rightSummaryLength += word.length
      canFit
    }).mkString("").trim()

    leftSummary + ' ' + rightSummary
  }

  val MAX_CHARACTER_LIMIT = 200
  val MAX_LEFT_CHARACTERS = 20
  val MAX_DISPLAYED_KEYWORDS = 3
  val DELIMITER_BETWEEN_KEYWORD_SUMMARIES = "…"
}

@SerialVersionUID(100L)
class KeywordSummarizer(
  keywords: List[String],
  maxLeftCharacters: Int = KeywordSummarizer.MAX_LEFT_CHARACTERS,
  maxLength: Int = KeywordSummarizer.MAX_CHARACTER_LIMIT,
  maxDisplayedKeywords: Int = KeywordSummarizer.MAX_DISPLAYED_KEYWORDS
) extends Summarizer {

  override def summarize(sentence: String): Option[String] = {
    if (keywords.isEmpty || isNullOrEmpty(sentence)) {
      return None
    }
    if (sentence.length <= maxLeftCharacters) {
      return Some(sentence)
    }

    val words = Tokenizer(sentence.replaceAll("\\s+", " ")).toList
    val lowerWords = words.map(_.toLowerCase)
    val matchedKeywords = keywords.map(keyword => (keyword, lowerWords.indexOf(keyword.toLowerCase))).filter(keywordAndIndex => keywordAndIndex._2 != -1).take(maxDisplayedKeywords).sortBy(keywordAndIndex => keywordAndIndex._2)
    if (matchedKeywords.isEmpty) {
      return Some(keywords.mkString(" "))
    }

    val spaceForDelimiters = (matchedKeywords.length - 1) * KeywordSummarizer.DELIMITER_BETWEEN_KEYWORD_SUMMARIES.length
    val maxLeftPerSummary = maxLeftCharacters / matchedKeywords.length
    val maxLengthPerSummary = (maxLength - spaceForDelimiters) / matchedKeywords.length

    Some(matchedKeywords.map(keywordAndIndex => KeywordSummarizer.createSummary(keywordAndIndex._1, keywordAndIndex._2, words, maxLeftPerSummary, maxLengthPerSummary)).mkString(KeywordSummarizer.DELIMITER_BETWEEN_KEYWORD_SUMMARIES))
  }
}
