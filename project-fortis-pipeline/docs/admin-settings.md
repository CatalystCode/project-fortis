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

**Note:** Some stream types, mentioned below, `require` trusted
  sources to be configured for event ingestion.

### Streams which require configured Trusted Sources

- Facebook
- RSS

## Restarting the Pipeline

It is necessary to restart the pipeline to update Fortis event ingestion with
your new admin settings. As some configurations may be updated more
frequently than others, these will need a manual pipeline restart. To restart
the pipeline manually, use the `restart pipeline button` on the corresponding
tab. Configurations that are infrequently changed will have automatic
pipeline restarts.

| Configurations  | Pipeline Restart |
| ----------------|------------------|
| Site Settings   | Manual           |
| Watchlist       | Manual           |
| Trusted Sources | Automatic        |
| Blacklist       | Manual           |
| Streams         | Automatic        |

## Site Settings

On this page, you can manage general configuration items for the site such as
the geographical area that your site monitors and the languages of events that
should be ingested.

Additionally, you can also use this page to update the credentials for third
party APIs leveraged by Fortis, such as MapBox and Cognitive Services.

The following list explains the settings managed on this site in more detail:

- **Site Name:** Unique identifier for your site. Can't be changed.

- **Site Title:** For branding, name of the site displayed on the navigation
  bar.

- **Bounding Box:** The geographical area that Fortis will monitor. The format of
  the bounding box is: `maxY,minX,minY,maxX`. You can use the [bounding box tool](http://boundingbox.klokantech.com/)
  to find the appropriate coordinates for your geographical area.

- **Header Logo Banner:** For branding, link to an image that will be
  displayed next to the site title on the navigation bar.

- **Supported Languages:** A list of the [ISO 639-1 language codes](https://www.loc.gov/standards/iso639-2/php/code_list.php)
  for all the locales for which you'd like to monitor events in your site.
  Entries are separated by commas, e.g. `en,ar` for Ensligh and Arabic.

- **Default Language:** The default language of events to display on the
  dashboard. You can switch to any of the non-default languages from the action
  buttons toolbar at the bottom of the dasboard UI.

- **Feature Service Namespace:** This specifies the granularity of locations
  that your Fortis site will monitor. Currently supported values are:
  - `wof` to monitor places in the entire world, based on Open Street Maps.
  - `divipola` for detailed Colombia places.
  For most deployments, `wof` is the right choice. If you have more specific
  location needs, please reach out so that we can work together to integrate
  your custom location sources into the [featureService](http://github.com/CatalystCode/featureService)
  used by Fortis.

- **MapBox token:** Free access token for [MapBox](https://www.mapbox.com/signup/),
  the service used to render the map on the Fortis dashboard. This access key
  is provided during the initial Fortis deployment.

- **Translation Services Token:** Needed for [text translation](https://azure.microsoft.com/en-us/services/cognitive-services/translator-text-api).
  This access key is set up automatically during the initial Fortis deployment.

- **Cognitive Services Speech Services Token:** Needed for [real-time audio](https://azure.microsoft.com/en-us/services/cognitive-services/speech/)
  ingestion and analysis. This access key is set up automatically during the
  initial Fortis deployment.

- **Cognitive Vision Services Token:** Needed for [image analysis](https://azure.microsoft.com/en-us/services/cognitive-services/computer-vision/).
  This access key is set up automatically during the initial Fortis deployment.

- **Cognitive Text Services Token:** Neded for [sentiment analysis](https://azure.microsoft.com/en-us/services/cognitive-services/text-analytics/).
  This access key is set up automatically during the initial Fortis deployment.

After changing the site settings, you should click the restart pipeline button to
propagate the changes to the Fortis event ingestion.

## Watchlist

On this page, you can manage the keywords you would like your Fortis site to
monitor. Fortis will only ingest and display events that match at least one
of the keywords you configure on this page.

Keywords can be grouped into different categories. You can either display
events matching all keywords on the dashboard or only the events pertaining
to a particular category.

Keywords can be single words such as `election` or phrases such as `election results`.
Fortis will only monitor events that match any of the keywords verbatim.

All keywords must be lowercase.

The following list explains the settings managed on this site in more detail:

- **Category:** Used to group keywords for separate display on the dashboard.

- **name:** The keyword to monitor. Note that currently keywords are limited to
  60 bytes in length due to limitations in the Twitter API. The UI will warn you
  if you add keywords that are too long.

- **name_{language}:** Keyword translated into other languages, used to monitor
  multi-lingual areas.

After changing the watchlist, you should click the restart pipeline button to
propagate the changes to the Fortis event ingestion.

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

## Users

On this page, you can manage access to your Fortis site. There are currently two
levels of access: `admin` and `user`. Users can only log into the site and view
the dashboard. Admins can additionally chage the settings for the site.

If you wish to enable anoymous access to Fortis, you can add the identity
`anonymous@fortis` to your users list and give it a role such as `user`.

The following list explains the settings managed on this site in more detail:

- **Identity:** The canonical email address of the users who have access to the
  site. Any Azure Active Directory v2 enabled email provider can be used,
  including Outlook, GMail, and so forth.

- **Role:** The level of access that the user should have, `admin` or `user`.

## Event Import

Still needs to be implemented.

## Trusted Sources

White-list trusted sources like Twitter accounts or RSS feeds. If you specify
trusted sources, Fortis will only ingest events that come from the sources you
trust for a particular data source instead of ingesting all the events.

For example, if you add trusted sources for your Twitter pipeline, Fortis will
only ingest tweets from those accounts that match the keywords you care about,
instead of ingesting all the tweets for anyone in your geographic area for those
keywords.

| Column Name         | Description   |
| ------------------- | ------------- |
| Pipeline Key        | Refer to `All Supported Trusted Sources` table below. |
| Name                | Friendly name you assign for your trusted source to act as an alias for the external source id. In the `dashboard` this friendly name will be what is displayed, not the external source id. (external source id will only be displayed if `Name` is not defined) |
| External Source Id  | Refer to `All Supported Trusted Sources` table below. |

After changing the trusted sources, the pipeline will automatically be restarted.

### List of All Supported Trusted Sources

A table of all supported `trusted sources` with their associated `pipeline keys` and descriptions of what to put as their `external source ids`. If you would like to add a new trusted source type to Fortis you can look in `project-fortis-spark's` `/streamfactories` and `/analyzers` and view their implementations.

| Pipeline Key           | External Source Id |
| ---------------------- | ------------------ |
| Bing                   | A bing page url `host` like http://nytimes.com. |
| CustomEvent            |  You as a user would define its structure. |
| Facebook               |  [Facebook Page Id](https://www.facebook.com/help/community/question/?id=378910098941520)   |
| HTML                   | A html page url `host` like http://nytimes.com.  |
| Instagram              | Instagram `username`. |
| Radio                  | Radio station `url`. |
| Reddit                 | The author's `username` of the reddit post. |
| RSS                    | A RSS feed `url` like https://reliefweb.int/headlines/rss.xml. |
| TadaWeb                | Tadaweb source. |
| Twitter                | Twitter `username` |

## Blacklisted Terms

On this page, you can manage keywords to blacklist in the pipeline.

You can blacklist individual terms such as `election` to filter from your
pipeline all the events that mention this term at least once.

You can also blacklist co-occurrences of terms to get more fine-grained
control over the events that get filtered out. For example, adding a
blacklist entry lik `Trump, Obama, election` will only filter out events that
mention each of these three terms at least once.

The following list explains the settings managed on this site in more detail:

- **Blacklisted Terms:** A comma delimited list of one or more keywords that if
  co-occurring in an event's text will lead that event to be excluded from
  your Fortis site.

- **Is Location:** If set to true, the blacklist will look at the event's
  locations instead of its text to determine whether the event should be
  excluded. For example, you can use this to exclude all events from a
  particular city, town or region.

After changing the blacklist, you should click the restart pipeline button to
propagate the changes to the Fortis event ingestion.

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

The following list explains the settings managed on this site in more detail:

- **Type:** The type of stream that your Fortis site is listening to, such as
  `Twitter`, `Facebook`, `Bing`, and so forth.

- **Status:** Whether or not the stream is active or suspended. Fortis will only
  ingest events from active streams.

- **Edit:** Open the editor to modify the stream, for example to update API
  access credentials.

After changing the streams, the pipeline will automatically be restarted.
