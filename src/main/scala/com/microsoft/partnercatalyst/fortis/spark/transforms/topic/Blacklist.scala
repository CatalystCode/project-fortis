package com.microsoft.partnercatalyst.fortis.spark.transforms.topic

import com.microsoft.partnercatalyst.fortis.spark.transforms.nlp.Tokenizer

@SerialVersionUID(100L)
class Blacklist(blacklist: Seq[Set[String]]) extends Serializable {
  def matches(text: String): Boolean = {
    if (text.isEmpty) {
      return false
    }

    val tokens = Tokenizer(text).toSet
    blacklist.exists(terms => terms.forall(tokens.contains))
  }
}
