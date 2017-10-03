package com.microsoft.partnercatalyst.fortis.spark.transforms.topic

import com.microsoft.partnercatalyst.fortis.spark.dto.Tag

class LuceneKeywordExtractor(language: String, keywords: Iterable[String], maxKeywords: Int = Int.MaxValue) extends KeywordExtractor(language, keywords, maxKeywords) {

  lazy private val luceneKeyphraseExtractor = new LuceneKeyphraseExtractor(language, keywords.toSet, maxKeywords)

  override def extractKeywords(text: String): List[Tag] = {
    luceneKeyphraseExtractor
      .extractKeyphrases(text)
      .map(kp=>Tag(kp.matchedPhrase, Some(1)))
      .toList
  }
}
