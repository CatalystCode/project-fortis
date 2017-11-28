package com.microsoft.partnercatalyst.fortis.spark.transforms.topic

import com.microsoft.partnercatalyst.fortis.spark.dto.BlacklistedItem
import com.microsoft.partnercatalyst.fortis.spark.transforms.nlp.Tokenizer

@SerialVersionUID(100L)
class Blacklist(blacklist: Seq[BlacklistedItem]) extends Serializable {
  def matches(text: String): Boolean = {
    if (text.isEmpty) {
      return false
    }

    val tokens = Tokenizer(text).toSet
    blacklist
      .filter(!_.isLocation)
      .exists(entry => entry.conjunctiveFilter.forall(tokens.contains))
  }

  def matches(terms: Set[String]): Boolean = {
    blacklist
      .filter(!_.isLocation)
      .exists(entry => entry.conjunctiveFilter.forall(terms.contains))
  }

  def matchesLocation(locations: Set[String]): Boolean = {
    // TODO: log if conjunctive filter has > 1 term and is of type location
    blacklist
      .filter(_.isLocation)
      .exists(entry => entry.conjunctiveFilter.forall(locations.contains))
  }
}
