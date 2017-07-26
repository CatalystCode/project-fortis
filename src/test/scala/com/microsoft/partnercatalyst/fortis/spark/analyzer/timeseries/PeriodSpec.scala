package com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries

import java.text.SimpleDateFormat

import org.scalatest.FlatSpec

class PeriodSpec extends FlatSpec {

  it should "format Minute to omit seconds" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:45")
    val formattedDate = PeriodType.Minute.format(date)
    assert(formattedDate == "minute-2016-07-04 08:15")
  }

  it should "truncate Minute at second zero" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:45")
    val truncatedDate = PeriodType.Minute.truncate(date)
    assert(format.format(truncatedDate) == "2016-07-04 08:15:00")
  }

  it should "format Hour to omit minutes and seconds" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:45")
    val formattedDate = PeriodType.Hour.format(date)
    assert(formattedDate == "hour-2016-07-04 08")
  }

  it should "truncate Hour at minute zero" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:32")
    val truncatedDate = PeriodType.Hour.truncate(date)
    assert(format.format(truncatedDate) == "2016-07-04 08:00:00")
  }

  it should "format Day to omit hour, minutes, and seconds" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:45")
    val formattedDate = PeriodType.Day.format(date)
    assert(formattedDate == "day-2016-07-04")
  }

  it should "truncate Day to midnight" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:32")
    val truncatedDate = PeriodType.Day.truncate(date)
    assert(format.format(truncatedDate) == "2016-07-04 00:00:00")
  }

  it should "format Month to contain year and month" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:45")
    val formattedDate = PeriodType.Month.format(date)
    assert(formattedDate == "month-2016-07")
  }

  it should "truncate Month to first of month" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:32")
    val truncatedDate = PeriodType.Month.truncate(date)
    assert(format.format(truncatedDate) == "2016-07-01 00:00:00")
  }

  it should "format Year to contain a single element" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:45")
    val formattedDate = PeriodType.Year.format(date)
    assert(formattedDate == "year-2016")
  }

  it should "truncate Year to January 1st" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val date = format.parse("2016-07-04 08:15:32")
    val truncatedDate = PeriodType.Year.truncate(date)
    assert(format.format(truncatedDate) == "2016-01-01 00:00:00")
  }

  it should "iterate Year period stream" in {
    val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
    val from = format.parse("2010-02-01 08:15:32")
    val to = format.parse("2014-07-04 08:15:32")
    val periods = PeriodType.Year.periodsBetween(from, to).toSeq
    assert(periods == Seq("year-2010", "year-2011", "year-2012", "year-2013", "year-2014"))
  }

}
