package com.microsoft.partnercatalyst.fortis.spark.transforms.language

import org.scalatest.FlatSpec

class LocalLanguageDetectorSpec extends FlatSpec {
  "The language detector" should "detect English" in {
    val detector = new LocalLanguageDetector()
    assert(detector.detectLanguage("And I in going, madam, weep o'er my father's death anew: but I must attend his majesty's command, to whom I am now in ward, evermore in subjection.").contains("en"))
  }

  it should "detect French" in {
    val detector = new LocalLanguageDetector()
    assert(detector.detectLanguage("Je l’avouerai franchement à mes lecteurs ; je n’étais jamais encore sorti de mon trou").contains("fr"))
  }

  it should "detect Spanish" in {
    val detector = new LocalLanguageDetector()
    assert(detector.detectLanguage("En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero").contains("es"))
  }

  it should "detect Chinese" in {
    val detector = new LocalLanguageDetector()
    assert(detector.detectLanguage("故经之以五事，校之以计，而索其情，一曰道，二曰天，三曰地，四曰将，五曰法。").contains("zh"))
  }

  it should "detect Urdu" in {
    val detector = new LocalLanguageDetector()
    assert(detector.detectLanguage("تازہ ترین خبروں، ویڈیوز اور آڈیوز کے لیے بی بی سی اردو پر آئیے۔ بی بی سی اردو دنیا بھر کی خبروں کے حصول کے لیے ایک قابلِ اعتماد ویب سائٹ ہے۔").contains("ur"))
  }

  it should "detect gibberish" in {
    val detector = new LocalLanguageDetector()
    assert(detector.detectLanguage("Heghlu'meH QaQ jajvam").isEmpty)
  }
}
