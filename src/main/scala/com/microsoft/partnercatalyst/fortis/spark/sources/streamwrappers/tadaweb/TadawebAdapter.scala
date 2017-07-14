package com.microsoft.partnercatalyst.fortis.spark.sources.streamwrappers.tadaweb

import net.liftweb.json

import scala.util.Try

object TadawebAdapter {
  def apply(input: String): Try[TadawebEvent] = {
    implicit val _ = json.DefaultFormats
    Try(json.parse(input)).flatMap(body => Try(body.extract[TadawebEvent]))
  }
}