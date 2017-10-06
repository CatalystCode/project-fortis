package com.microsoft.partnercatalyst.fortis.spark.transforms.summary

import org.scalatest.FlatSpec

class KeywordSummarizerSpec extends FlatSpec {
  "The keyword summarizer" should "not summarize empty text" in {
    val summarizer = new KeywordSummarizer(List("foo", "bar"))

    assert(summarizer.summarize("").isEmpty)
    assert(summarizer.summarize(null).isEmpty)
  }

  it should "not summarize without keywords" in {
    val summarizer = new KeywordSummarizer(List())

    assert(summarizer.summarize("some text").isEmpty)
  }

  it should "not summarize short sentences" in {
    val summarizer = new KeywordSummarizer(List("foo"))

    assert(summarizer.summarize("some foo text").contains("some foo text"))
  }

  it should "return keywords separated by space" in {
    val summarizer = new KeywordSummarizer(List("abc", "123"))
    assert(summarizer.summarize("As simple as do re mi. Baby, you and me girl. As simple as do re mi. Baby, you and me girl. As simple as do re mi. Baby, you and me girl.") == Some("abc 123"))
  }

  it should "summarize long text" in {
    val summarizer = new KeywordSummarizer(List("italy"))

    assert(summarizer.summarize(
      """
      | TUNIS/ROME (Reuters) - An armed group is stopping migrant boats from setting off across the Mediterranean from a city west of Tripoli that has been a springboard for people smugglers, causing a sudden drop in departures over the past month, sources in the area said.
      |
      | The revelation throws new light on the sharp reduction in migrant arrivals from Italy, which took over from the Aegean route as the main focus of European concerns in the crisis.
      |
      | Arrivals in Italy from North Africa, the main route for migration to Europe this year, dropped by more than 50 percent in July from a year earlier, and August arrivals so far are down even further. July and August are peak months for migrant boats because of favorable sea conditions.
      """.stripMargin).contains("arrivals from Italy, which took over from the Aegean route as the main focus of European concerns in the crisis. Arrivals in Italy from North Africa, the main route for migration to Europe this year,"))
  }
}
