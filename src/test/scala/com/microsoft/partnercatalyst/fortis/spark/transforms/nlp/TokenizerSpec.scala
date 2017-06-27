package com.microsoft.partnercatalyst.fortis.spark.transforms.nlp

import org.scalatest.FlatSpec

class TokenizerSpec extends FlatSpec {
  "The tokenizer" should "split sentences on spaces" in {
    assert(Tokenizer("foo bar baz") == Seq("foo", " ", "bar", " ", "baz"))
  }

  it should "handle non-space whitespace" in {
    assert(Tokenizer("\rfoo\tbar\nbaz") == Seq("\r", "foo", "\t", "bar", "\n", "baz"))
  }

  it should "handle non-standard whitespace" in {
    assert(Tokenizer("foo\u2000bar\u00a0baz") == Seq("foo", "\u2000", "bar", "\u00a0", "baz"))
  }

  it should "handle empty inputs" in {
    assert(Tokenizer("") == Seq())
  }
}
