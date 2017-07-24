package com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries

import java.text.SimpleDateFormat
import java.util.{Calendar, Date, GregorianCalendar, TimeZone}

case class Period(timestamp: Long, periodType: PeriodType) extends Serializable {
  override def toString: String = periodType.formatTimestamp(this.timestamp)
}

object PeriodType {

  val Minute = PeriodType("minute", 60 * 1000, "yyyy-MM-dd HH:mm", Set())

  val Hour = PeriodType("hour", 60L * Minute.sizeInMilliseconds, "yyyy-MM-dd HH", Set(Calendar.MINUTE))

  val Day = PeriodType("day", 24L * Hour.sizeInMilliseconds, "yyyy-MM-dd", Set(Calendar.MINUTE, Calendar.HOUR_OF_DAY))

  val Week = PeriodType("week", 7L * Day.sizeInMilliseconds, "yyyy-w", Set(Calendar.MINUTE, Calendar.HOUR_OF_DAY, Calendar.WEEK_OF_YEAR))

  val Month = PeriodType("month", 30L * Day.sizeInMilliseconds, "yyyy-MM", Set(Calendar.MINUTE, Calendar.HOUR_OF_DAY, Calendar.DAY_OF_MONTH))

  val Year = PeriodType("year", 12L * Month.sizeInMilliseconds, "yyyy", Set(Calendar.MINUTE, Calendar.HOUR_OF_DAY, Calendar.DAY_OF_MONTH, Calendar.MONTH))

  val all: Set[PeriodType] = Set(Minute, Hour, Day, Month, Year)
}

case class PeriodType(periodTypeName: String, sizeInMilliseconds: Long, format: String, truncateFields: Set[Int]) extends Serializable {

  def formatTimestamp(timestamp: Long, timeZone: Option[TimeZone] = None): String = {
    format(new Date(timestamp), timeZone)
  }

  def format(date: Date, timeZone: Option[TimeZone] = None): String = {
    val sdf = new SimpleDateFormat(this.format)
    if (timeZone.isDefined) {
      sdf.setTimeZone(timeZone.get)
    }
    sdf.format(date)
  }

  def truncateTimestamp(timestamp: Long, timeZone: Option[TimeZone] = None): Long = {
    val calendar = new GregorianCalendar()
    if (timeZone.isDefined) {
      calendar.setTimeZone(timeZone.get)
    }
    calendar.setTimeInMillis(timestamp)
    calendar.set(Calendar.MILLISECOND, 0)
    calendar.set(Calendar.SECOND, 0)
    this.truncateFields.foreach {
      case field@Calendar.DAY_OF_MONTH => calendar.set(field, 1)
      case field => calendar.set(field, 0)
    }
    calendar.getTimeInMillis
  }

  def truncate(date: Date, timeZone: Option[TimeZone] = None): Date = {
    new Date(truncateTimestamp(date.getTime, timeZone))
  }

  def periodsBetweenTimestamps(from: Long, to: Long, timeZone: Option[TimeZone] = None): Iterator[String] = {
    val min = Math.min(from, to)
    val max = Math.max(from, to)
    (min to max by this.sizeInMilliseconds).iterator.map(formatTimestamp(_, timeZone))
  }

  def periodsBetween(from: Date, to: Date, timeZone: Option[TimeZone] = None): Iterator[String] = {
    periodsBetweenTimestamps(from.getTime, to.getTime, timeZone)
  }

}
