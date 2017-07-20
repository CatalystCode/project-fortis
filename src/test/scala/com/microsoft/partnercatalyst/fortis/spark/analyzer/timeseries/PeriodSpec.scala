package com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries

import java.text.SimpleDateFormat

import org.scalatest.FlatSpec

class PeriodTypeSpec extends FlatSpec {

  "Minute" should "format to omit seconds" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:45")
    val formattedDate = PeriodType.Minute.format(date)
    assert(formattedDate == "2016-07-04 08:15")
  }

  "Minute" should "truncate at second zero" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:45")
    val truncatedDate = PeriodType.Minute.truncate(date)
    assert(format.format(truncatedDate) == "2016-07-04 08:15:00")
  }

  "Hour" should "truncate to omit minutes and seconds" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:45")
    val formattedDate = PeriodType.Hour.format(date)
    assert(formattedDate == "2016-07-04 08")
  }

  "Hour" should "truncate at minute zero" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:32")
    val truncatedDate = PeriodType.Hour.truncate(date)
    assert(format.format(truncatedDate) == "2016-07-04 08:00:00")
  }

  "Day" should "format to omit hour, minutes, and seconds" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:45")
    val formattedDate = PeriodType.Day.format(date)
    assert(formattedDate == "2016-07-04")
  }

  "Day" should "truncate to midnight" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:32")
    val truncatedDate = PeriodType.Day.truncate(date)
    assert(format.format(truncatedDate) == "2016-07-04 00:00:00")
  }

  "Month" should "format to contain year and month" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:45")
    val formattedDate = PeriodType.Month.format(date)
    assert(formattedDate == "2016-07")
  }

  "Month" should "truncate to first of month" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:32")
    val truncatedDate = PeriodType.Month.truncate(date)
    assert(format.format(truncatedDate) == "2016-07-01 00:00:00")
  }

  "Year" should "format to contain a single element" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:45")
    val formattedDate = PeriodType.Year.format(date)
    assert(formattedDate == "2016")
  }

  "Year" should "truncate to January 1st" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:32")
    val truncatedDate = PeriodType.Year.truncate(date)
    assert(format.format(truncatedDate) == "2016-01-01 00:00:00")
  }

  "Year" should "iterate period stream" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val from = format.parse("2010-02-01 08:15:32")
    val to = format.parse("2014-07-04 08:15:32")
    val periods = PeriodType.Year.periodsBetween(from, to).toSeq
    assert(periods == Seq("2010", "2011", "2012", "2013", "2014"))
  }

}
