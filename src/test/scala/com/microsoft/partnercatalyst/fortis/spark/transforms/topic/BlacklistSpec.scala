package com.microsoft.partnercatalyst.fortis.spark.transforms.topic

import com.microsoft.partnercatalyst.fortis.spark.dto.BlacklistedTerm
import org.scalatest.FlatSpec

class BlacklistSpec extends FlatSpec {
  "The blacklist" should "match matching text" in {
    val blacklist = new Blacklist(Seq(BlacklistedTerm(Set("foo"))))
    assert(blacklist.matches("foo bar"))
    assert(!blacklist.matches("bar baz"))
  }

  it should "match conjunctions" in {
    val blacklist = new Blacklist(Seq(BlacklistedTerm(Set("foo", "bar"))))
    assert(blacklist.matches("bar baz foo"))
    assert(!blacklist.matches("bar baz"))
  }

  it should "match any conjunctions" in {
    val blacklist = new Blacklist(Seq(BlacklistedTerm(Set("foo", "bar")), BlacklistedTerm(Set("pear"))))
    assert(blacklist.matches("a b pear c"))
    assert(blacklist.matches("bar baz foo"))
  }

  it should "handle the empty string" in {
    val blacklist = new Blacklist(Seq(BlacklistedTerm(Set("foo", "bar")), BlacklistedTerm(Set("pear"))))
    assert(!blacklist.matches(""))
  }
}
