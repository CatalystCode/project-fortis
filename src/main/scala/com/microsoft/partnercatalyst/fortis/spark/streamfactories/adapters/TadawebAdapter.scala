package com.microsoft.partnercatalyst.fortis.spark.streamfactories.adapters

import com.microsoft.partnercatalyst.fortis.spark.tadaweb.dto.TadawebEvent
import net.liftweb.json

import scala.util.Try

object TadawebAdapter {

  /**
    * Parses a [[TadawebEvent]] from a JSON string.
    *
    * @param input The JSON string.
    * @return The event.
    */
  def apply(input: String): Try[TadawebEvent] = {
    implicit val _ = json.DefaultFormats
    Try(json.parse(input)).flatMap(body => Try(body.extract[TadawebEvent]))
  }
}