package com.microsoft.partnercatalyst.fortis.spark.analyzer.timeseries

trait AreaFinder {
  def findArea(tilez: Int, tilex: Int, tiley: Int): Option[Area]
}

object Area {

  def apply(tilez: Int, rangex: Tuple2[Int, Int], rangey: Tuple2[Int, Int]): Area = new Area(
    tilez,
    Tuple2(Math.min(rangex._1, rangex._2), Math.max(rangex._1, rangey._2)),
    Tuple2(Math.min(rangey._1, rangey._2), Math.max(rangey._1, rangey._2))
  )

}

class Area private (val tilez: Int, val rangex: Tuple2[Int, Int], val rangey: Tuple2[Int, Int]) extends Serializable {

  def +(that: Area): Area = {
    assert(this.tilez == that.tilez)
    Area(
      tilez,
      Tuple2(Math.min(this.rangex._1, that.rangex._1), Math.max(this.rangex._2, that.rangex._2)),
      Tuple2(Math.min(this.rangey._1, that.rangey._1), Math.max(this.rangey._2, that.rangey._2))
    )
  }

  def intersectsWith(other: Area): Boolean = {
    if (this.tilez != other.tilez) {
      return false
    }

    if (this.rangex._1 > other.rangex._2 || other.rangex._1 > this.rangex._2) {
      return false
    }

    if (this.rangey._1 > other.rangey._2 || other.rangey._1 > this.rangey._2) {
      return false
    }

    true
  }

}
