package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import java.text.SimpleDateFormat
import java.util.{Calendar, Date, GregorianCalendar, TimeZone}

import org.joda.time._

object Period {

  def apply(timestamp: Long, periodType: PeriodType): Period = new Period(timestamp, periodType)

  def apply(periodString: String): Period = {
    val segments = periodString.split('-')
    if (segments.length < 2) {
      throw new RuntimeException("Invalid period string " + periodString)
    }

    val periodTypeName = segments(0)
    val periodType = PeriodType.byName(periodTypeName)
    val periodValue = periodString.substring(periodTypeName.length + 1)
    val timestamp = periodType.parse(periodValue)
    Period(timestamp, periodType)
  }

}

class Period(timestamp: Long, periodType: PeriodType) extends Serializable {

  private val defaultTimeZone = TimeZone.getTimeZone("UTC")

  override def toString: String = periodType.format(this.timestamp)

  def startTime(timeZone: TimeZone = defaultTimeZone): Long = periodType.truncate(this.timestamp, timeZone)

  def endTime(timeZone: TimeZone = defaultTimeZone): Long = periodType.periodAfter(this.timestamp, timeZone)

  def retrospectivePeriods(config: PeriodRetrospectiveConfig = new DefaultPeriodRetrospectiveConfig): List[String] = this.periodType.retrospectivePeriods(this.timestamp, config)

}

object PeriodType {

  val Minute = PeriodType("minute", Minutes.minutes, "yyyy-MM-dd HH:mm", Set())

  val Hour = PeriodType("hour", Hours.hours, "yyyy-MM-dd HH", Set(Calendar.MINUTE))

  val Day = PeriodType("day", Days.days, "yyyy-MM-dd", Set(Calendar.MINUTE, Calendar.HOUR_OF_DAY))

  val Week = PeriodType("week", Weeks.weeks, "yyyy-w", Set(Calendar.MINUTE, Calendar.HOUR_OF_DAY, Calendar.DAY_OF_WEEK))

  val Month = PeriodType("month", Months.months, "yyyy-MM", Set(Calendar.MINUTE, Calendar.HOUR_OF_DAY, Calendar.DAY_OF_MONTH))

  val Year = PeriodType("year", Years.years, "yyyy", Set(Calendar.MINUTE, Calendar.HOUR_OF_DAY, Calendar.DAY_OF_MONTH, Calendar.MONTH))

  val all: Set[PeriodType] = Set(Minute, Hour, Day, Week, Month, Year)

  val byName = all.groupBy(_.periodTypeName).mapValues(v=>v.head)

}

case class PeriodType(periodTypeName: String, increment: Int=>ReadablePeriod, format: String, truncateFields: Set[Int]) extends Serializable {

  private val defaultTimeZone = TimeZone.getTimeZone("UTC")

  def parse(periodValue: String, timeZone: TimeZone = defaultTimeZone): Long = {
    val sdf = new SimpleDateFormat(this.format)
    sdf.setTimeZone(timeZone)
    sdf.parse(periodValue).getTime
  }

  def format(timestamp: Long, timeZone: TimeZone = defaultTimeZone): String = {
    val sdf = new SimpleDateFormat(this.format)
    sdf.setTimeZone(timeZone)

    val formattedDate = sdf.format(new Date(timestamp))
    this.periodTypeName + "-" + formattedDate
  }

  def truncate(timestamp: Long, timeZone: TimeZone = defaultTimeZone): Long = {
    val calendar = new GregorianCalendar()
    calendar.setTimeZone(timeZone)
    calendar.setTimeInMillis(timestamp)
    calendar.set(Calendar.MILLISECOND, 0)
    calendar.set(Calendar.SECOND, 0)
    this.truncateFields.foreach {
      case field@Calendar.DAY_OF_MONTH => calendar.set(field, 1)
      case field@Calendar.DAY_OF_WEEK => calendar.set(Calendar.DAY_OF_WEEK, 1)
      case field => calendar.set(field, 0)
    }
    calendar.getTimeInMillis
  }

  def periodAfter(from: Long, timeZone: TimeZone = defaultTimeZone): Long = {
    val currentDateTime = new DateTime(truncate(from))
    currentDateTime.plus(increment(1)).getMillis
  }

  def periodsBetween(from: Long, to: Long, timeZone: TimeZone = defaultTimeZone): Iterator[String] = {
    val min = Math.min(from, to)
    val max = Math.max(from, to)

    case class PeriodIterator(min: Long, max: Long) extends Iterator[String] {

      var currentDateTime = new DateTime(min)

      override def hasNext: Boolean = currentDateTime.isBefore(max+1)

      override def next(): String = {
        val period = format(currentDateTime.getMillis, timeZone)
        currentDateTime = currentDateTime.plus(increment(1))
        period
      }

    }
    PeriodIterator(min, max)
  }

  def retrospectivePeriods(referenceTime: Long, config: PeriodRetrospectiveConfig = new DefaultPeriodRetrospectiveConfig): List[String] = {
    val periodCountPerType = config.retrospectivePeriodCountPerType()
    val periodWindowSize = periodCountPerType.getOrElse(this.periodTypeName, 1)

    val endPeriod = new DateTime(referenceTime)
    val startPeriod = endPeriod.minus(this.increment(periodWindowSize-1))

    this.periodsBetween(startPeriod.getMillis, endPeriod.getMillis).toList
  }

}

trait PeriodRetrospectiveConfig extends Serializable {
  def retrospectivePeriodCountPerType(): Map[String, Int]
}

case class DefaultPeriodRetrospectiveConfig() extends PeriodRetrospectiveConfig {
  override def retrospectivePeriodCountPerType(): Map[String, Int] = Map(
    (PeriodType.Minute.periodTypeName, 4*60), /* 4 hours */
    (PeriodType.Hour.periodTypeName, 7*24), /* 7 days */
    (PeriodType.Day.periodTypeName, 30), /* 4 weeks */
    (PeriodType.Week.periodTypeName, 6*4), /* 6 months */
    (PeriodType.Month.periodTypeName, 3*12), /* 3 years */
    (PeriodType.Year.periodTypeName, 7) /* 7 years */
  )
}

