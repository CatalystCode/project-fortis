package com.microsoft.partnercatalyst.fortis.spark.transforms.topic

import org.scalatest.FlatSpec

class KeywordExtractorSpec extends FlatSpec {
  "The keyword extractor" should "extract overlapping keywords" in {
    val keywords = List(
      "The quick",
      "quick brown",
      "quick brown fox"
    )

    val extractor = new KeywordExtractor(keywords)

    val matches = extractor.extractKeywords("The quick brown fox.").map(_.name)
    assert(keywords.forall(keyword => matches.exists(m => keyword == m)))
  }

  it should "respect word boundaries" in {
    val keywords = List(
      "brown fox"
    )

    val extractor = new KeywordExtractor(keywords)

    // "brown fox" should not be found since "brown" is not prefixed by a word boundary
    var matches = extractor.extractKeywords("The quickbrown fox.")
    assert(matches.isEmpty)

    matches = extractor.extractKeywords("The 123brown fox.")
    assert(matches.isEmpty)

    // "brown fox" should not be found since fox is not postfixed by a word boundary
    matches = extractor.extractKeywords("The quick brown foxjumped")
    assert(matches.isEmpty)

    matches = extractor.extractKeywords("The quick brown fox123")
    assert(matches.isEmpty)

    // "brown fox" *should* be found since a symbol like '#' creates a word boundary
    matches = extractor.extractKeywords("The quick#brown fox#jumped")
    assert(matches.nonEmpty)
  }

  it should "be case-insensitive but preserve keyword case" in {
    val keywords = List(
      "BROwN FoX"
    )

    val extractor = new KeywordExtractor(keywords)

    val matches = extractor.extractKeywords("The quick browN fOx").map(_.name).toIterable
    assert(matches.head == keywords.head)
  }

  it should "find keywords starting and ending with symbols anywhere" in {
    val keywords = List(
      "{testing}"
    )

    val extractor = new KeywordExtractor(keywords)

    val matches = extractor.extractKeywords("Testing{testing}123").map(_.name).toIterable
    assert(matches.head == keywords.head)
  }
}