package com.microsoft.partnercatalyst.fortis.spark.analyzer

import java.net.URL

import com.github.catalystcode.fortis.spark.streaming.facebook.dto.FacebookPost
import facebook4j.Post
import org.mockito.Mockito
import org.scalatest.FlatSpec
import org.scalatest.mock.MockitoSugar

class FacebookPostAnalyzerTestSpec extends FlatSpec with MockitoSugar {

  "getSourceURL" should "build a url from getPermalinkUrl.toString" in {
    val post = mock[Post]
    val permalink = mock[URL]
    Mockito.when(permalink.toString).thenReturn("http://github.com/CatalystCode")
    Mockito.when(permalink.getFile).thenThrow(new RuntimeException("Some exception"))
    Mockito.when(post.getPermalinkUrl).thenReturn(permalink)
    val url = new FacebookPostAnalyzer().getSourceURL(FacebookPost(
      pageId = "abc123",
      post = post
    ))
    assert(url == "http://github.com/CatalystCode")
  }

  "getSourceURL" should "build a url from getFile" in {
    val post = mock[Post]
    val permalink = mock[URL]
    Mockito.when(permalink.toString).thenThrow(new RuntimeException("Some exception."))
    Mockito.when(permalink.getFile).thenReturn("/some/path/to/post")
    Mockito.when(post.getPermalinkUrl).thenReturn(permalink)
    val url = new FacebookPostAnalyzer().getSourceURL(FacebookPost(
      pageId = "abc123",
      post = post
    ))
    assert(url == "https://www.facebook.com/some/path/to/post")
  }

  "getSourceURL" should "build a url from pageId" in {
    val facebookPost = FacebookPost(
      pageId = "abc123",
      post = null
    )
    val url = new FacebookPostAnalyzer().getSourceURL(facebookPost)
    assert(url == s"https://www.facebook.com/${facebookPost.pageId}/posts")
  }
}
