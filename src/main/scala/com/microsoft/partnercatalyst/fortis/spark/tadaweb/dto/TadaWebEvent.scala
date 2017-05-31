package com.microsoft.partnercatalyst.fortis.spark.tadaweb.dto

case class TadaWebEvent(
  language: String,
  text: String,
  cities: Seq[TadaWebCity],
  sentiment: String,
  tada: TadaWebTada,
  tags: Seq[String],
  title: String,
  link: String,
  published_at: String
)

case class TadaWebCity(
  city: String,
  coordinates: Seq[Double]
)

case class TadaWebTada(
  description: String,
  id: String,
  name: String
)