package com.microsoft.partnercatalyst.fortis.spark.transforms.topic

import com.microsoft.partnercatalyst.fortis.spark.transforms.nlp.Tokenizer

class Blacklist(blacklist: Seq[Set[String]]) {
  def matches(text: String): Boolean = {
    val tokens = Tokenizer(text).toSet
    blacklist.exists(terms => terms.forall(tokens.contains))
  }
}
