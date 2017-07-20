package com.microsoft.partnercatalyst.fortis.spark.transforms.topic

import com.microsoft.partnercatalyst.fortis.spark.dto.BlacklistedTerm
import com.microsoft.partnercatalyst.fortis.spark.transforms.nlp.Tokenizer

@SerialVersionUID(100L)
class Blacklist(blacklist: Seq[BlacklistedTerm]) extends Serializable {
  def matches(text: String): Boolean = {
    if (text.isEmpty) {
      return false
    }

    val tokens = Tokenizer(text).toSet
    blacklist.exists(entry => entry.conjunctiveFilter.forall(tokens.contains))
  }
}
