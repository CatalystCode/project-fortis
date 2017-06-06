package com.microsoft.partnercatalyst.fortis.spark.tadaweb.dto

case class TadawebEvent(
  language: String,
  text: String,
  cities: Seq[TadawebCity],
  sentiment: String,
  tada: TadawebTada,
  tags: Seq[String],
  title: String,
  link: String,
  published_at: String
)

case class TadawebCity(
  city: String,
  coordinates: Seq[Double]
)

case class TadawebTada(
  description: String,
  id: String,
  name: String
)