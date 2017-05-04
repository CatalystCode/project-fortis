package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import org.scalatest.FlatSpec

class StringUtilsTests extends FlatSpec {
  "The ngrams method" should "extract correct ngrams" in {
    assert(StringUtils.ngrams("the koala eats", n = 1) == List("the", "koala", "eats"))
    assert(StringUtils.ngrams("the koala eats", n = 2) == List("the", "koala", "eats", "the koala", "koala eats"))
    assert(StringUtils.ngrams("the koala eats", n = 3) == List("the", "koala", "eats", "the koala", "koala eats", "the koala eats"))
    assert(StringUtils.ngrams("the koala eats", n = 4) == List("the", "koala", "eats", "the koala", "koala eats", "the koala eats"))
  }

  it should "ignore extra whitespace" in {
    assert(StringUtils.ngrams("the  koala  eats ", n = 2) == List("the", "koala", "eats", "the koala", "koala eats"))
  }

  it should "ignore punctuation" in {
    assert(StringUtils.ngrams("the koala, eats!", n = 2) == List("the", "koala", "eats", "the koala", "koala eats"))
  }
}
