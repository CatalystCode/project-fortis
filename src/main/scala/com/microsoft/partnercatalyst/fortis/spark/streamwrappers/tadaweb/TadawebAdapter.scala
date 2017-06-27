package com.microsoft.partnercatalyst.fortis.spark.streamwrappers.tadaweb

import com.microsoft.partnercatalyst.fortis.spark.tadaweb.dto.TadawebEvent
import net.liftweb.json

import scala.util.Try

object TadawebAdapter {
  def apply(input: String): Try[TadawebEvent] = {
    implicit val _ = json.DefaultFormats
    Try(json.parse(input)).flatMap(body => Try(body.extract[TadawebEvent]))
  }
}