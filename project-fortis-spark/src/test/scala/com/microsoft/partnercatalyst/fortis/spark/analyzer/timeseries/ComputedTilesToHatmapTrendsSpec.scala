package com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries

import com.microsoft.partnercatalyst.fortis.spark.dto.ComputedTile
import org.apache.spark.{SparkConf, SparkContext}
import org.scalatest.{BeforeAndAfter, FlatSpec}

class ComputedTilesToHatmapTrendsSpec extends FlatSpec with BeforeAndAfter {

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

  it should "result in positive score for a positive trend" in {
    val tiles = Seq(
      ComputedTile(2010, 0, PeriodType.Year.periodTypeName, "2010", "twitter", 8, 1, 2, "HamillHimself", 100, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2011, 0, PeriodType.Year.periodTypeName, "2011", "twitter", 8, 1, 2, "HamillHimself", 200, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2012, 0, PeriodType.Year.periodTypeName, "2012", "twitter", 8, 1, 2, "HamillHimself", 300, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2013, 0, PeriodType.Year.periodTypeName, "2013", "twitter", 8, 1, 2, "HamillHimself", 400, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2014, 0, PeriodType.Year.periodTypeName, "2014", "twitter", 8, 1, 2, "HamillHimself", 500, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2015, 0, PeriodType.Year.periodTypeName, "2015", "twitter", 8, 1, 2, "HamillHimself", 600, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2016, 0, PeriodType.Year.periodTypeName, "2016", "twitter", 8, 1, 2, "HamillHimself", 700, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2017, 0, PeriodType.Year.periodTypeName, "2017", "twitter", 8, 1, 2, "HamillHimself", 800, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None))
    )
    val trends = ComputedTilesToComputedTrends(sc.makeRDD(tiles)).collect()
    assert(trends.length == 1)
    assert(trends(0).score.toInt == 100)
  }

  it should "result in negative score for a downward trend" in {
    val tiles = Seq(
      ComputedTile(2010, 0, PeriodType.Year.periodTypeName, "2010", "twitter", 8, 1, 2, "HamillHimself", 100, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2011, 0, PeriodType.Year.periodTypeName, "2011", "twitter", 8, 1, 2, "HamillHimself", 90, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2012, 0, PeriodType.Year.periodTypeName, "2012", "twitter", 8, 1, 2, "HamillHimself", 80, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2013, 0, PeriodType.Year.periodTypeName, "2013", "twitter", 8, 1, 2, "HamillHimself", 70, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2014, 0, PeriodType.Year.periodTypeName, "2014", "twitter", 8, 1, 2, "HamillHimself", 60, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2015, 0, PeriodType.Year.periodTypeName, "2015", "twitter", 8, 1, 2, "HamillHimself", 50, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2016, 0, PeriodType.Year.periodTypeName, "2016", "twitter", 8, 1, 2, "HamillHimself", 40, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2017, 0, PeriodType.Year.periodTypeName, "2017", "twitter", 8, 1, 2, "HamillHimself", 30, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None))
    )
    val trends = ComputedTilesToComputedTrends(sc.makeRDD(tiles)).collect()
    assert(trends.length == 1)
    assert(trends(0).score.toInt == -10)
  }

  it should "result in zero score for a flat trend" in {
    val tiles = Seq(
      ComputedTile(2010, 0, PeriodType.Year.periodTypeName, "2010", "twitter", 8, 1, 2, "HamillHimself", 100, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2011, 0, PeriodType.Year.periodTypeName, "2011", "twitter", 8, 1, 2, "HamillHimself", 90, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2012, 0, PeriodType.Year.periodTypeName, "2012", "twitter", 8, 1, 2, "HamillHimself", 100, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2013, 0, PeriodType.Year.periodTypeName, "2013", "twitter", 8, 1, 2, "HamillHimself", 90, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2014, 0, PeriodType.Year.periodTypeName, "2014", "twitter", 8, 1, 2, "HamillHimself", 100, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2015, 0, PeriodType.Year.periodTypeName, "2015", "twitter", 8, 1, 2, "HamillHimself", 90, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2016, 0, PeriodType.Year.periodTypeName, "2016", "twitter", 8, 1, 2, "HamillHimself", 100, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2017, 0, PeriodType.Year.periodTypeName, "2017", "twitter", 8, 1, 2, "HamillHimself", 90, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None))
    )
    val trends = ComputedTilesToComputedTrends(sc.makeRDD(tiles)).collect()
    assert(trends.length == 1)
    assert(trends(0).score.toInt == 0)
  }

  it should "result in different scores for different topic tuples" in {
    val tiles = Seq(
      ComputedTile(2010, 0, PeriodType.Year.periodTypeName, "2010", "twitter", 8, 1, 2, "HamillHimself", 100, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2011, 0, PeriodType.Year.periodTypeName, "2011", "twitter", 8, 1, 2, "HamillHimself", 101, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2012, 0, PeriodType.Year.periodTypeName, "2012", "twitter", 8, 1, 2, "HamillHimself", 200, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2013, 0, PeriodType.Year.periodTypeName, "2013", "twitter", 8, 1, 2, "HamillHimself", 101, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2014, 0, PeriodType.Year.periodTypeName, "2014", "twitter", 8, 1, 2, "HamillHimself", 300, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2015, 0, PeriodType.Year.periodTypeName, "2015", "twitter", 8, 1, 2, "HamillHimself", 101, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2016, 0, PeriodType.Year.periodTypeName, "2016", "twitter", 8, 1, 2, "HamillHimself", 400, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2017, 0, PeriodType.Year.periodTypeName, "2017", "twitter", 8, 1, 2, "HamillHimself", 101, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),

      ComputedTile(2010, 0, PeriodType.Year.periodTypeName, "2010", "twitter", 8, 1, 2, "HamillHimself", 10, 0, "", Seq(), 0, Tuple3(Some("humanitarian"), None, None)),
      ComputedTile(2011, 0, PeriodType.Year.periodTypeName, "2011", "twitter", 8, 1, 2, "HamillHimself", 20, 0, "", Seq(), 0, Tuple3(Some("humanitarian"), None, None)),
      ComputedTile(2012, 0, PeriodType.Year.periodTypeName, "2012", "twitter", 8, 1, 2, "HamillHimself", 30, 0, "", Seq(), 0, Tuple3(Some("humanitarian"), None, None)),
      ComputedTile(2013, 0, PeriodType.Year.periodTypeName, "2013", "twitter", 8, 1, 2, "HamillHimself", 90, 0, "", Seq(), 0, Tuple3(Some("humanitarian"), None, None)),
      ComputedTile(2014, 0, PeriodType.Year.periodTypeName, "2014", "twitter", 8, 1, 2, "HamillHimself", 91, 0, "", Seq(), 0, Tuple3(Some("humanitarian"), None, None)),
      ComputedTile(2015, 0, PeriodType.Year.periodTypeName, "2015", "twitter", 8, 1, 2, "HamillHimself", 92, 0, "", Seq(), 0, Tuple3(Some("humanitarian"), None, None)),
      ComputedTile(2016, 0, PeriodType.Year.periodTypeName, "2016", "twitter", 8, 1, 2, "HamillHimself", 93, 0, "", Seq(), 0, Tuple3(Some("humanitarian"), None, None)),
      ComputedTile(2017, 0, PeriodType.Year.periodTypeName, "2017", "twitter", 8, 1, 2, "HamillHimself", 94, 0, "", Seq(), 0, Tuple3(Some("humanitarian"), None, None)),

      ComputedTile(2010, 0, PeriodType.Year.periodTypeName, "2010", "twitter", 8, 1, 2, "HamillHimself", 10, 0, "", Seq(), 0, Tuple3(Some("syria"), None, None)),
      ComputedTile(2011, 0, PeriodType.Year.periodTypeName, "2011", "twitter", 8, 1, 2, "HamillHimself", 20, 0, "", Seq(), 0, Tuple3(Some("syria"), None, None)),
      ComputedTile(2012, 0, PeriodType.Year.periodTypeName, "2012", "twitter", 8, 1, 2, "HamillHimself", 30, 0, "", Seq(), 0, Tuple3(Some("syria"), None, None)),
      ComputedTile(2013, 0, PeriodType.Year.periodTypeName, "2013", "twitter", 8, 1, 2, "HamillHimself", 20, 0, "", Seq(), 0, Tuple3(Some("syria"), None, None)),
      ComputedTile(2014, 0, PeriodType.Year.periodTypeName, "2014", "twitter", 8, 1, 2, "HamillHimself", 40, 0, "", Seq(), 0, Tuple3(Some("syria"), None, None)),
      ComputedTile(2015, 0, PeriodType.Year.periodTypeName, "2015", "twitter", 8, 1, 2, "HamillHimself", 30, 0, "", Seq(), 0, Tuple3(Some("syria"), None, None)),
      ComputedTile(2016, 0, PeriodType.Year.periodTypeName, "2016", "twitter", 8, 1, 2, "HamillHimself", 40, 0, "", Seq(), 0, Tuple3(Some("syria"), None, None)),
      ComputedTile(2017, 0, PeriodType.Year.periodTypeName, "2017", "twitter", 8, 1, 2, "HamillHimself", 50, 0, "", Seq(), 0, Tuple3(Some("syria"), None, None))
    )
    val trends = ComputedTilesToComputedTrends(sc.makeRDD(tiles)).collect()
    assert(trends.map(_.score.toInt).sorted.toList == List(4, 13, 16))
  }

  it should "result in different scores for different pipelines" in {
    val tiles = Seq(
      ComputedTile(2010, 0, PeriodType.Year.periodTypeName, "2010", "twitter", 8, 1, 2, "HamillHimself", 100, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2011, 0, PeriodType.Year.periodTypeName, "2011", "twitter", 8, 1, 2, "HamillHimself", 120, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2012, 0, PeriodType.Year.periodTypeName, "2012", "twitter", 8, 1, 2, "HamillHimself", 200, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2013, 0, PeriodType.Year.periodTypeName, "2013", "twitter", 8, 1, 2, "HamillHimself", 130, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2014, 0, PeriodType.Year.periodTypeName, "2014", "twitter", 8, 1, 2, "HamillHimself", 300, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2015, 0, PeriodType.Year.periodTypeName, "2015", "twitter", 8, 1, 2, "HamillHimself", 140, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2016, 0, PeriodType.Year.periodTypeName, "2016", "twitter", 8, 1, 2, "HamillHimself", 400, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2017, 0, PeriodType.Year.periodTypeName, "2017", "twitter", 8, 1, 2, "HamillHimself", 150, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),

      ComputedTile(2010, 0, PeriodType.Year.periodTypeName, "2010", "reddit", 8, 1, 2, "HamillHimself", 10, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2011, 0, PeriodType.Year.periodTypeName, "2011", "reddit", 8, 1, 2, "HamillHimself", 20, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2012, 0, PeriodType.Year.periodTypeName, "2012", "reddit", 8, 1, 2, "HamillHimself", 30, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2013, 0, PeriodType.Year.periodTypeName, "2013", "reddit", 8, 1, 2, "HamillHimself", 90, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2014, 0, PeriodType.Year.periodTypeName, "2014", "reddit", 8, 1, 2, "HamillHimself", 91, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2015, 0, PeriodType.Year.periodTypeName, "2015", "reddit", 8, 1, 2, "HamillHimself", 92, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2016, 0, PeriodType.Year.periodTypeName, "2016", "reddit", 8, 1, 2, "HamillHimself", 93, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2017, 0, PeriodType.Year.periodTypeName, "2017", "reddit", 8, 1, 2, "HamillHimself", 94, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),

      ComputedTile(2010, 0, PeriodType.Year.periodTypeName, "2010", "facebook", 8, 1, 2, "HamillHimself", 10, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2011, 0, PeriodType.Year.periodTypeName, "2011", "facebook", 8, 1, 2, "HamillHimself", 30, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2012, 0, PeriodType.Year.periodTypeName, "2012", "facebook", 8, 1, 2, "HamillHimself", 50, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2013, 0, PeriodType.Year.periodTypeName, "2013", "facebook", 8, 1, 2, "HamillHimself", 20, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2014, 0, PeriodType.Year.periodTypeName, "2014", "facebook", 8, 1, 2, "HamillHimself", 40, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2015, 0, PeriodType.Year.periodTypeName, "2015", "facebook", 8, 1, 2, "HamillHimself", 60, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2016, 0, PeriodType.Year.periodTypeName, "2016", "facebook", 8, 1, 2, "HamillHimself", 30, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2017, 0, PeriodType.Year.periodTypeName, "2017", "facebook", 8, 1, 2, "HamillHimself", 50, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None))
    )
    val trends = ComputedTilesToComputedTrends(sc.makeRDD(tiles)).collect()
    assert(trends.map(_.score.toInt).sorted.toList == List(3, 13, 20))
  }

  it should "result in different scores for different zoom levels" in {
    val tiles = Seq(
      ComputedTile(2010, 0, PeriodType.Year.periodTypeName, "2010", "twitter", 8, 1, 2, "HamillHimself", 100, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2011, 0, PeriodType.Year.periodTypeName, "2011", "twitter", 8, 1, 2, "HamillHimself", 120, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2012, 0, PeriodType.Year.periodTypeName, "2012", "twitter", 8, 1, 2, "HamillHimself", 200, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2013, 0, PeriodType.Year.periodTypeName, "2013", "twitter", 8, 1, 2, "HamillHimself", 130, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2014, 0, PeriodType.Year.periodTypeName, "2014", "twitter", 8, 1, 2, "HamillHimself", 300, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2015, 0, PeriodType.Year.periodTypeName, "2015", "twitter", 8, 1, 2, "HamillHimself", 140, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2016, 0, PeriodType.Year.periodTypeName, "2016", "twitter", 8, 1, 2, "HamillHimself", 400, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2017, 0, PeriodType.Year.periodTypeName, "2017", "twitter", 8, 1, 2, "HamillHimself", 150, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),

      ComputedTile(2010, 0, PeriodType.Year.periodTypeName, "2010", "twitter", 9, 1, 2, "HamillHimself", 100, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2011, 0, PeriodType.Year.periodTypeName, "2011", "twitter", 9, 1, 2, "HamillHimself", 120, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2012, 0, PeriodType.Year.periodTypeName, "2012", "twitter", 9, 1, 2, "HamillHimself", 200, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2013, 0, PeriodType.Year.periodTypeName, "2013", "twitter", 9, 1, 2, "HamillHimself", 130, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2014, 0, PeriodType.Year.periodTypeName, "2014", "twitter", 9, 1, 2, "HamillHimself", 300, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2015, 0, PeriodType.Year.periodTypeName, "2015", "twitter", 9, 1, 2, "HamillHimself", 140, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2016, 0, PeriodType.Year.periodTypeName, "2016", "twitter", 9, 1, 2, "HamillHimself", 400, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2017, 0, PeriodType.Year.periodTypeName, "2017", "twitter", 9, 1, 2, "HamillHimself", 150, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),

      ComputedTile(2010, 0, PeriodType.Year.periodTypeName, "2010", "twitter", 10, 1, 2, "HamillHimself", 100, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2011, 0, PeriodType.Year.periodTypeName, "2011", "twitter", 10, 1, 2, "HamillHimself", 120, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2012, 0, PeriodType.Year.periodTypeName, "2012", "twitter", 10, 1, 2, "HamillHimself", 200, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2013, 0, PeriodType.Year.periodTypeName, "2013", "twitter", 10, 1, 2, "HamillHimself", 130, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2014, 0, PeriodType.Year.periodTypeName, "2014", "twitter", 10, 1, 2, "HamillHimself", 300, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2015, 0, PeriodType.Year.periodTypeName, "2015", "twitter", 10, 1, 2, "HamillHimself", 140, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2016, 0, PeriodType.Year.periodTypeName, "2016", "twitter", 10, 1, 2, "HamillHimself", 400, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None)),
      ComputedTile(2017, 0, PeriodType.Year.periodTypeName, "2017", "twitter", 10, 1, 2, "HamillHimself", 150, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None))
    )
    val trends = ComputedTilesToComputedTrends(sc.makeRDD(tiles)).collect()
    assert(trends.map(_.score.toInt).sorted.toList == List(20, 20, 20))
  }

  it should "format groups" in {
    val group = ComputedTilesToComputedTrends.tileGroup(
      ComputedTile(2017, 0, PeriodType.Year.periodTypeName, "2017", "twitter", 10, 1, 2, "HamillHimself", 150, 0, "", Seq(), 0, Tuple3(Some("europe"), None, None))
    )
    assert(group == "(twitter,(Some(europe),None,None),10)")
  }

}
