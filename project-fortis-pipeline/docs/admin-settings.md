# Configuring your Fortis site

Project Fortis comes with an admin page with which you can edit site configurations and also provide details on how events should be monitored and processed. Through the admin site, you will be able to configure site settings, blacklist terms, whitelist terms (watchlist), streams (twitter, facebook, etc.), monitored places, and trusted sources.

## Site Settings

Manage service tokens and set up how the site should be displayed.

| Value               | Description          |
| ------------------- | ------------- |
| Site Name           | Used as part of the admin url.  |
| Site Title          | Displayed on the navigation bar.|
| Bounding Box        | By default follows `Who's on First (WOF)`. The format of the WOF bounding box is: `maxY,minX,minY,maxX`. |
| Header Logo Banner  | Image path of banner.  |
| Supported Languages | A comma delimited string with languages formatted as language codes like `en` or `ar`. The admin site can translate to any of the supported languages. For a list of all `supported languages`, you can make a call to [`/GetLanguagesForTranslate`](http://docs.microsofttranslator.com/text-translate.html#!/default/get_GetLanguagesForTranslate), which will return a list of language codes supported by the [Translation Service](http://docs.microsofttranslator.com/text-translate.html).
| Default Language    | The admin site will be displayed in this language. |
| Feature Service     | The feature service namespace. The namespace should be `wof` for whole-world places based on open street maps or `divipola` for detailed Colombia places. More documentation on the feature service [here](https://github.com/CatalystCode/featureService).  |
| Translation Services Token | Needed for real-time text translation. Get a token [here](https://azure.microsoft.com/en-us/services/cognitive-services/translator-text-api).  |
| Cognitive Services Text Analytics Token | [Obtain a token through these instructions](https://docs.microsoft.com/en-us/azure/cognitive-services/text-analytics/how-tos/text-analytics-how-to-signup). | Optional |
| Cognitive Services Text Translataion Token | [Obtain a token through these instructions](https://docs.microsoft.com/en-us/azure/cognitive-services/translator/translator-text-how-to-signup). | Optional |
| Cognitive Services Computer Vision Token | To obtain a key, follow [these instructions](https://docs.microsoft.com/en-us/azure/cognitive-services/text-analytics/how-tos/text-analytics-how-to-signup), but instead search for `computer vision ai` when creating the resource. | Optional |
| Cognitive Services Bing Speech Token | To obtain a key, follow [these instructions](https://docs.microsoft.com/en-us/azure/cognitive-services/text-analytics/how-tos/text-analytics-how-to-signup), but instead search for `bing speech api` when creating the resource. | Optional |

## Watchlist

Manage keywords you would like to monitor. Keywords belong to different categories, which you will define in `watchlist` settings.

| Column Name         | Description   |
| ------------------- | ------------- |
| Category            | Categories are used to classify different keywords into logical groups. |
| name                | Keyword in the site's default language. |
| name_{language}     | Keyword translated to the site's supported language. |

### Adding Keywords with Excel then Translating them to a Supported Language

To add keywords quickly, you can copy keyword categories and keywords from `excel`, then paste them into the corresponding columns of the watchlist table. To get keyword translations in a supported languages, check the rows you would like translations for and then press the button `translate selection(s)`.

For example, in Excel you may have:

| Category            | Name          |
| ------------------- | ------------- |
| armed conflict      | ammo          |
| armed conflict      | gun           |
| health              | medicine      |

## Event Import

Still needs to be implemented.

## Trusted Sources

Manage trusted sources like `twitter`, `facebook`, etc.

| Column Name         | Description   |
| ------------------- | ------------- |
| Pipeline Key        | Refer to `All Supported Trusted Sources` table below. |
| External Source Id  | Refer to `All Supported Trusted Sources` table below. |
| Category            | The category specifies what set of `watchlist` keywords are monitored in the pipeline for a particular source type. Categories are originally defined in the `watchlist` tab. For example, if the category is `armed conflict` and the source type is `Facebook` for a row in the trusted sources table, then the pipeline will process any facebook events containing keywords in the `armed conflict` category. |
| Name                | Friendly name you assign for your trusted source to act as an alias for the external source id. In the `dashboard` this friendly name will be what is displayed, not the external source id. (external source id will only be displayed if `Name` is not defined) |
| Source Type         | Refer to `All Supported Trusted Sources` table below. | 
| Rank                | An `Integer` value. The `rank` does not affect the way events are processed in the pipeline and does not affect the ui (though the rank feature may be added in the future), but it is still a required field. |  

### List of All Supported Trusted Sources

A table of all supported `trusted sources` with their associated `pipeline keys` and descriptions of what to put as their `external source ids`. If you would like to add a new trusted source to Fortis you can look in `project-fortis-spark's` `/streamfactories` and `/analyzers` and view their implementations.

| Source Type            | Pipeline Key  | External Source Id |
| ---------------------- | ------------- | ------------------ |
| BingPage               | BingPage      | A bing page url `host` like `nytimes.com`. |
| CustomEvent            | CustomEvent   | You as a user would define its structure. |
| Facebook               | Facebook      | [Facebook Page Id](https://www.facebook.com/help/community/question/?id=378910098941520)   |
| HTML                   | HTML          | A html page url `host` like `nytimes.com`.  |
| Instagram              | Instagram     | An instagram `username`. |
| Radio                  | Radio         | A radio station's `url`. |
| Reddit                 | Reddit        | The author's `username` of the reddit post. |
| RSS                    | RSS           | A RSS feed `url`. | 
| TadaWeb                | TadaWeb       | Tadaweb name. |
| Twitter                | Twitter       | [Twitter Id](http://mytwitterid.com/) |

## Blacklisted Terms

Manage keywords to blacklist in the pipeline. For example, if you have `Trump, Obama, election` in your blacklist, then events containing one or more of these keywords will be filtered in the pipeline and will not be displayed on the ui.

| Column Name         | Description   |
| ------------------- | ------------- |
| Blacklisted Terms   | Enter a grouping of keywords for a blacklist as a comma delimited string: Trump, Obama, election. |
| Is Location | A boolean specifying whether the blacklist should only be only applied to a particular location. |

## Streams

Manage streams by providing parameters like api keys, secrets, etc. needed to connect to trusted sources. For example, suppose you defined a few facebook pages and and twitter users as trusted sources. If you decided not to monitor twitter anymore, you could disable the twitter stream. Also, suppose you got a new api key for facebook, you can update the key here.

| Column Name         | Description   |
| ------------------- | ------------- |
| Status              | Values are either `enabled` or `disabled`. If a stream is disabled, no events will be collected on that stream in the pipeline. |
| Pipeline Key        | Key associated with a pipeline. |
| Params              | Parameters used in different trusted sources like `twitter`, `facebook` etc. For example, for a `twitter` stream, parameters you might have would be `consumer key`, `consumer secret`, `access token key`, `access token secret`. These are formatted as key value pairs. |
