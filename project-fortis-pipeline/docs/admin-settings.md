# Configuring your Fortis site

Fortis comes with a settings page with which you can edit site configurations
and also provide details on how events should be monitored and processed.

Through the settings page, you will be able to configure amonst others:
- General settings about your deployment in the "Site Settings" tab
- Blacklist terms and whitelist terms in the "Watchlist" tab.
- Data sources to watch like Twitter, Facebook, Bing, etc in the "Streams" tab.

A full description of all the settings follows in the sections below.

## Required settings

After setting up a new Fortis site, at the very least you should configure the
following to start monitoring events:

- A bounding box on the "Site Settings" tab; Fortis will only ingest events that
  fall inside of the geographical area that you specify on this tab.
- One or more keywords on the "Watchlist" tab; Fortis will only ingest events
  that match any of the keywords you specify on this tab.
- One or more data sources on the "Streams" tab; Fortis will only ingest events
  sourced from the data sources that you specify on this tab.

## Site Settings

On this page, you can manage general configuration items for the site such as
the geographical area that your site monitors and the languages of events that
should be ingested.

Additionally, you can also use this page to update the credentials for third
party APIs leveraged by Fortis, such as MapBox and Cognitive Services.

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

On this page, you can manage the keywords you would like your Fortis site to
monitor. Fortis will only ingest and display events that match at least one
of the keywords you configure on this page.

Keywords can be grouped into different categories. You can either display
events matching all keywords on the dashboard or only the events pertaining
to a particular category.

Keywords can be single words such as `election` or phrases such as `election results`.
Fortis will only monitor events that match any of the keywords verbatim.

Note that currently keywords are limited to 60 bytes in length due to
limitations in the Twitter API. The UI will automatically warn you if you add
keywords that are too long.

| Column Name         | Description   |
| ------------------- | ------------- |
| Category            | Categories are used to classify different keywords into logical groups. |
| name                | Keyword in the site's default language. |
| name_{language}     | Keyword translated to the site's supported language. |

### Adding Keywords with Excel then translating them to a supported language

To add keywords quickly, you can copy keyword categories and keywords from
`excel`, then paste them into the corresponding columns of the watchlist
table.

For example, in Excel you may have:

| Category            | Name          |
| ------------------- | ------------- |
| armed conflict      | ammo          |
| armed conflict      | gun           |
| health              | medicine      |

Copying the cell values and pasting them on the "Watchlist" settings tab will
automatically populate the page for you.

To get keyword translations in a supported languages, check the rows you would
like translations for and then press the button `translate selection(s)`. This
will leverage the [Translator Text API](https://azure.microsoft.com/en-us/services/cognitive-services/translator-text-api/)
to automatically localize the keywords.

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

On this page, you can manage keywords to blacklist in the pipeline.

You can blacklist individual terms such as `election` to filter from your
pipeline all the events that mention this term at least once.

You can also blacklist co-occurrences of terms to get more fine-grained
control over the events that get filtered out. For example, adding a
blacklist entry lik `Trump, Obama, election` will only filter out events that
mention each of these three terms at least once.

| Column Name         | Description   |
| ------------------- | ------------- |
| Blacklisted Terms   | Enter a grouping of keywords for a blacklist as a comma delimited string. |
| Is Location | A boolean specifying whether the blacklist should only be only applied to a particular location. |

## Streams

On this page, you can manage the data sources to which your Fortis site listens.

For each data source, you'll have to provide parameters like API keys, secrets,
configuration parameters and so forth. The stream creation wizard will guide you
to correctly configure the data sources. If you need to update these parameters
in the future, you can edit them on this page.

You can also use this page to manage the life-cycle of the data sources.
For example, if you defined a Twitter stream but later decide that you no longer
wish to monitor Twitter, you can set the stream to disabled on this page and
Fortis will no longer ingest events from Twitter going forward.

| Column Name         | Description   |
| ------------------- | ------------- |
| Status              | Values are either `enabled` or `disabled`. If a stream is disabled, no events will be collected on that stream in the pipeline. |
| Pipeline Key        | Key associated with a pipeline. |
| Params              | Parameters used in different trusted sources like `twitter`, `facebook` etc. For example, for a `twitter` stream, parameters you might have would be `consumer key`, `consumer secret`, `access token key`, `access token secret`. These are formatted as key value pairs. |
