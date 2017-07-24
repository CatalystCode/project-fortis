package com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries

import com.microsoft.partnercatalyst.fortis.spark.dto.ComputedTile
import org.apache.spark.{SparkConf, SparkContext}
import org.scalatest.{BeforeAndAfter, FlatSpec}

class ComputedTilesToComputedTrendsSpec extends FlatSpec with BeforeAndAfter {

  private val conf = new SparkConf()
    .setAppName(this.getClass.getSimpleName)
    .setMaster("local[*]")
    .set("output.consistency.level", "LOCAL_ONE")

  private var sc: SparkContext = _
  before {
    sc = new SparkContext(conf)
  }

  after {
    sc.stop()
  }

  "Upward trend" should "result in positive score" in {
    val tiles = Seq(
      ComputedTile(2010, 0, PeriodType.Year.periodTypeName, "2010", "twitter", 8, 1, 2, "MarkHamillHimself", 100, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2011, 0, PeriodType.Year.periodTypeName, "2011", "twitter", 8, 1, 2, "MarkHamillHimself", 200, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2012, 0, PeriodType.Year.periodTypeName, "2012", "twitter", 8, 1, 2, "MarkHamillHimself", 300, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2013, 0, PeriodType.Year.periodTypeName, "2013", "twitter", 8, 1, 2, "MarkHamillHimself", 400, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2014, 0, PeriodType.Year.periodTypeName, "2014", "twitter", 8, 1, 2, "MarkHamillHimself", 500, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2015, 0, PeriodType.Year.periodTypeName, "2015", "twitter", 8, 1, 2, "MarkHamillHimself", 600, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2016, 0, PeriodType.Year.periodTypeName, "2016", "twitter", 8, 1, 2, "MarkHamillHimself", 700, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2017, 0, PeriodType.Year.periodTypeName, "2017", "twitter", 8, 1, 2, "MarkHamillHimself", 800, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None))
    )
    val trends = ComputedTilesToComputedTrends(sc.makeRDD(tiles)).collect()
    assert(trends.length == 1)
    assert(trends(0).score.toInt == 100)
  }

  "Downward trend" should "result in negative score" in {
    val tiles = Seq(
      ComputedTile(2010, 0, PeriodType.Year.periodTypeName, "2010", "twitter", 8, 1, 2, "MarkHamillHimself", 100, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2011, 0, PeriodType.Year.periodTypeName, "2011", "twitter", 8, 1, 2, "MarkHamillHimself", 90, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2012, 0, PeriodType.Year.periodTypeName, "2012", "twitter", 8, 1, 2, "MarkHamillHimself", 80, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2013, 0, PeriodType.Year.periodTypeName, "2013", "twitter", 8, 1, 2, "MarkHamillHimself", 70, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2014, 0, PeriodType.Year.periodTypeName, "2014", "twitter", 8, 1, 2, "MarkHamillHimself", 60, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2015, 0, PeriodType.Year.periodTypeName, "2015", "twitter", 8, 1, 2, "MarkHamillHimself", 50, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2016, 0, PeriodType.Year.periodTypeName, "2016", "twitter", 8, 1, 2, "MarkHamillHimself", 40, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2017, 0, PeriodType.Year.periodTypeName, "2017", "twitter", 8, 1, 2, "MarkHamillHimself", 30, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None))
    )
    val trends = ComputedTilesToComputedTrends(sc.makeRDD(tiles)).collect()
    assert(trends.length == 1)
    assert(trends(0).score.toInt == -10)
  }

  "No trend" should "result in zero score" in {
    val tiles = Seq(
      ComputedTile(2010, 0, PeriodType.Year.periodTypeName, "2010", "twitter", 8, 1, 2, "MarkHamillHimself", 100, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2011, 0, PeriodType.Year.periodTypeName, "2011", "twitter", 8, 1, 2, "MarkHamillHimself", 90, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2012, 0, PeriodType.Year.periodTypeName, "2012", "twitter", 8, 1, 2, "MarkHamillHimself", 100, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2013, 0, PeriodType.Year.periodTypeName, "2013", "twitter", 8, 1, 2, "MarkHamillHimself", 90, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2014, 0, PeriodType.Year.periodTypeName, "2014", "twitter", 8, 1, 2, "MarkHamillHimself", 100, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2015, 0, PeriodType.Year.periodTypeName, "2015", "twitter", 8, 1, 2, "MarkHamillHimself", 90, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2016, 0, PeriodType.Year.periodTypeName, "2016", "twitter", 8, 1, 2, "MarkHamillHimself", 100, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2017, 0, PeriodType.Year.periodTypeName, "2017", "twitter", 8, 1, 2, "MarkHamillHimself", 90, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None))
    )
    val trends = ComputedTilesToComputedTrends(sc.makeRDD(tiles)).collect()
    assert(trends.length == 1)
    assert(trends(0).score.toInt == 0)
  }

}
