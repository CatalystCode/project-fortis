package com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.dto

case class JsonSentimentDetectionResponse(documents: List[JsonSentimentDetectionResponseItem], errors: List[JsonSentimentDetectionResponseError] = List())
case class JsonSentimentDetectionResponseItem(id: String, score: Double)
case class JsonSentimentDetectionResponseError(id: String, message: String)

case class JsonSentimentDetectionRequest(documents: List[JsonSentimentDetectionRequestItem])
case class JsonSentimentDetectionRequestItem(id: String, text: String, language: String)
