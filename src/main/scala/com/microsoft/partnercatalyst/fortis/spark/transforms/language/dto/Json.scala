package com.microsoft.partnercatalyst.fortis.spark.transforms.language.dto

case class JsonLanguageDetectionResponse(documents: List[JsonLanguageDetectionResponseItem], errors: List[JsonLanguageDetectionResponseError] = List())
case class JsonLanguageDetectionResponseItem(id: String, detectedLanguages: List[JsonLanguageDetectionLanguage])
case class JsonLanguageDetectionLanguage(name: String, iso6391Name: String, score: Double)
case class JsonLanguageDetectionResponseError(id: String, message: String)

case class JsonLanguageDetectionRequest(documents: List[JsonLanguageDetectionRequestItem])
case class JsonLanguageDetectionRequestItem(id: String, text: String)
