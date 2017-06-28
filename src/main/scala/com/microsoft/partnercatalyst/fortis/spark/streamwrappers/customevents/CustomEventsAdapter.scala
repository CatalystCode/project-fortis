package com.microsoft.partnercatalyst.fortis.spark.streamwrappers.customevents

import net.liftweb.json

import scala.util.Try

object CustomEventsAdapter {
  def apply(input: String): Try[CustomEvent] = {
    implicit val _ = json.DefaultFormats
    Try(json.parse(input)).flatMap(body => Try(body.extract[CustomEvent]))
  }
}