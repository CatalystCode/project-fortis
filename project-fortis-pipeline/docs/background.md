# Fortis background information

## Overview

Project Fortis is a data ingestion, analysis and visualization pipeline. The
Fortis pipeline collects social media conversations and postings from the public
web and darknet data sources.

![Overview of the Fortis project workflow](https://user-images.githubusercontent.com/1086421/35058654-a326c8e8-fb86-11e7-9dbb-f3e719aabf48.png)

## Monitoring

Fortis is a flexible project and can be configured for many situations, e.g.:
* Ingesting from multiple data sources, including:
  - Twitter
  - Facebook
  - Public Web (via Bing)
  - RSS
  - Reddit
  - Instagram
  - Radio Broadcasts
  - ACLED
* Fortis also comes with pre-configured terms to monitor sites of these types:
  - Humanitarian
  - Climate Change
  - Health

## Architecture

![Overview of the Fortis pipeline architecture](https://user-images.githubusercontent.com/1086421/33353437-d1ed7fc8-d47b-11e7-9f05-818723f8c09c.png)

## Articles

- [Spark Streaming Transformations: A Deep-dive](https://medium.com/@kevin_hartman/spark-streaming-transformations-a-deep-dive-b82787e53288)
- [Permissively-Licensed Named Entity Recognition on the JVM](https://www.microsoft.com/developerblog/2017/11/20/opener-permissively-licensed-named-entity-recognition-on-the-jvm/)
- [Building a Custom Spark Connector for Near Real-Time Speech-to-Text Transcription](https://www.microsoft.com/developerblog/2017/11/01/building-a-custom-spark-connector-for-near-real-time-speech-to-text-transcription/)
- [Geocoding Social Conversations with NLP and JavaScript](https://www.microsoft.com/developerblog/2017/06/06/geocoding-social-conversations-nlp-javascript/)
- [Accelerating UN Humanitarian Aid Planning with GraphQL](https://www.microsoft.com/developerblog/2017/05/10/graphql-providing-context-into-global-crisiss-and-social-public-data-sources/)

## Videos

- [Dashboard walkthrough (in Spanish)](http://aka.ms/fortis-colombia-demo)
- [KubeCon conference talk](https://www.youtube.com/watch?v=UywgL70FQ3s)
- [Microsoft Build conference talk](https://www.youtube.com/watch?v=2shdR1R-EYk)
- [Spark Summit conference talk](https://www.youtube.com/watch?v=FTrVO9toO0I)

## Open Source

We published several generally useful open source projects as part of the
development of Fortis, including:

- [Spark Streaming connector for Facebook](http://github.com/CatalystCode/streaming-facebook)
- [Spark Streaming connector for Instagram](https://github.com/CatalystCode/streaming-instagram)
- [Spark Streaming connector for Reddit](https://github.com/CatalystCode/streaming-reddit)
- [Spark Streaming connector for Bing](https://github.com/CatalystCode/streaming-bing)
- [Spark Streaming connector for RSS](https://github.com/CatalystCode/streaming-rss-html)
- [Advanced filtering options for Twitter Spark Streaming connector](https://github.com/apache/bahir/pull/43)
