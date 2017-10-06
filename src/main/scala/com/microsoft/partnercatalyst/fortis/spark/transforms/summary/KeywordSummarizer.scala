package com.microsoft.partnercatalyst.fortis.spark.transforms.summary

import com.google.common.base.Strings.isNullOrEmpty

trait Summarizer extends Serializable {
  def summarize(text: String): Option[String]
}

object KeywordSummarizer {
  val MAX_CHARACTER_LIMIT = 200
  val MAX_LEFT_CHARACTERS = 20
}

@SerialVersionUID(100L)
class KeywordSummarizer(
  keywords: List[String],
  maxLeftCharacters: Int = KeywordSummarizer.MAX_LEFT_CHARACTERS,
  maxLength: Int = KeywordSummarizer.MAX_CHARACTER_LIMIT
) extends Summarizer {

  /**
   * @see https://github.com/CatalystCode/project-fortis-azure-functions/blob/5e8ec0d7a71be875a6d668abd372955c81f431c0/postgresMessagePusher/index.js#L81-L104
   */
  override def summarize(sentence: String): Option[String] = {
    if (keywords.isEmpty || isNullOrEmpty(sentence)) {
      return None
    }
    if (sentence.length <= maxLeftCharacters) {
      return Some(sentence)
    }

    val trimmedSentence = sentence.replaceAll("\\s+", " ")

    val keywordFirstOccurrence = indexOfFirstKeywordFound(trimmedSentence.toLowerCase())
    if (keywordFirstOccurrence == -1) {
      return Some(keywords.mkString(" "))
    }
    if (keywordFirstOccurrence < maxLeftCharacters) {
      return Option(trimmedSentence.substring(0, if (trimmedSentence.length > maxLength) maxLength else trimmedSentence.length))
    }

    var leftIndex = 0
    var i = keywordFirstOccurrence - 1
    while (i > 0 && (keywordFirstOccurrence - i) < maxLeftCharacters) {
      if (trimmedSentence.charAt(i) == ' ') {
        leftIndex = i
      }
      i -= 1
    }

    Option(trimmedSentence.substring(leftIndex + 1, if (leftIndex + maxLength < trimmedSentence.length) leftIndex + maxLength else trimmedSentence.length))
  }

  private def indexOfFirstKeywordFound(sentence: String): Int = {
    for (k <- keywords) {
      val index = sentence.indexOf(k.toLowerCase())
      if (index != -1) {
        return index
      }
    }
    return -1
  }

}
