/**************************************
 * Site settings
 *************************************/

INSERT INTO fortis.sitesettings (sitename, cogspeechsvctoken, cogtextsvctoken, cogvisionsvctoken, defaultlanguage, defaultzoom, featureservicenamespace, geofence, insertiontime, languages, logo, title, translationsvctoken) VALUES ('America', '66f22689995d4be38c6f7f9ac7ba249f', '80f235db0967430d846bd8f77a22e42a', '1dd074f644224107af93967b8b846ca9', 'en', 9, 'wof', [41.5700, -74.5157, 40.4520, -73.5681], toTimestamp(now()), {'en'}, 'http://www2.pr.gov/PublishingImages/flags_logo_prgov.png', 'America' , 'db72531814634cb08469524652ad05a8');

/**************************************
 * Streams
 *************************************/

INSERT INTO fortis.streams (pipelinekey, streamid, streamfactory, pipelineicon, pipelinelabel, params, enabled) VALUES ('RSS', uuid(), 'RSS', 'f fa-rss', 'RSS Feeds', { 'feedUrls': 'http://www.contextoganadero.com/rss' }, true);
INSERT INTO fortis.streams (pipelinekey, streamid, streamfactory, pipelineicon, pipelinelabel, params, enabled) VALUES ('RSS', uuid(), 'RSS', 'f fa-rss', 'RSS Feeds', { 'feedUrls': 'http://www.eltiempo.com/rss/bogota.xml' }, true);
INSERT INTO fortis.streams (pipelinekey, streamid, streamfactory, pipelineicon, pipelinelabel, params, enabled) VALUES ('RSS', uuid(), 'RSS', 'f fa-rss', 'RSS Feeds', { 'feedUrls': 'http://www.eltiempo.com/rss/colombia.xml' }, true);
INSERT INTO fortis.streams (pipelinekey, streamid, streamfactory, pipelineicon, pipelinelabel, params, enabled) VALUES ('RSS', uuid(), 'RSS', 'f fa-rss', 'RSS Feeds', { 'feedUrls': 'http://www.eltiempo.com/rss/economia.xml' }, true);
INSERT INTO fortis.streams (pipelinekey, streamid, streamfactory, pipelineicon, pipelinelabel, params, enabled) VALUES ('RSS', uuid(), 'RSS', 'f fa-rss', 'RSS Feeds', { 'feedUrls': 'http://www.eltiempo.com/rss/opinion.xml' }, true);
INSERT INTO fortis.streams (pipelinekey, streamid, streamfactory, pipelineicon, pipelinelabel, params, enabled) VALUES ('RSS', uuid(), 'RSS', 'f fa-rss', 'RSS Feeds', { 'feedUrls': 'http://www.eltiempo.com/rss/politica.xml' }, true);
INSERT INTO fortis.streams (pipelinekey, streamid, enabled, params, pipelineicon, pipelinelabel, streamfactory) VALUES ('Twitter', uuid(), True, {'consumerKey': 'ucyxNPXjuXP6Bk2h6RTHsbvSr', 'consumerSecret': 'I52jDoERPthFX3cZVpcqNU18xMFZMYuw1tCx0RuP79eUX6pQBY', 'accessToken': '808417685130321920-Szs6Wytce9W9Pazo7CGSnj0sRA36LoC', 'accessTokenSecret': '9miohljpfd56nTY1mbIk3SnVR7YFOah293Vhu8lQJZFbC'}, 'fa fa-twitter', 'Twitter', 'Twitter');
INSERT INTO fortis.streams (pipelinekey, streamid, streamfactory, pipelineicon, pipelinelabel, params, enabled) VALUES ('RSS', uuid(), 'RSS', 'f fa-rss', 'RSS Feeds', { 'feedUrls': 'https://www.boston.com/feed' }, true);
INSERT INTO fortis.streams (pipelinekey, streamid, streamfactory, pipelineicon, pipelinelabel, params, enabled) VALUES ('RSS', uuid(), 'RSS', 'f fa-rss', 'RSS Feeds', { 'feedUrls': 'http://feeds.washingtonpost.com/rss/politics' }, true);
INSERT INTO fortis.streams (pipelinekey, streamid, streamfactory, pipelineicon, pipelinelabel, params, enabled) VALUES ('RSS', uuid(), 'RSS', 'f fa-rss', 'RSS Feeds', { 'feedUrls': 'http://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml' }, true);

/**************************************
 * Watchlist
 *************************************/

INSERT INTO fortis.watchlist (topicid, topic, lang_code, translations, category, insertiontime) VALUES (uuid(), 'tax', 'en', {}, 'General', toTimestamp(now()));
INSERT INTO fortis.watchlist (topicid, topic, lang_code, translations, category, insertiontime) VALUES (uuid(), 'election', 'en', {}, 'General', toTimestamp(now()));
INSERT INTO fortis.watchlist (topicid, topic, lang_code, translations, category, insertiontime) VALUES (uuid(), 'weinstein', 'en', {}, 'General', toTimestamp(now()));
INSERT INTO fortis.watchlist (topicid, topic, lang_code, translations, category, insertiontime) VALUES (uuid(), 'kevin spacey', 'en', {}, 'General', toTimestamp(now()));
INSERT INTO fortis.watchlist (topicid, topic, lang_code, translations, category, insertiontime) VALUES (uuid(), 'spacey', 'en', {}, 'General', toTimestamp(now()));
INSERT INTO fortis.watchlist (topicid, topic, lang_code, translations, category, insertiontime) VALUES (uuid(), 'ISIS', 'en', {}, 'General', toTimestamp(now()));
INSERT INTO fortis.watchlist (topicid, topic, lang_code, translations, category, insertiontime) VALUES (uuid(), 'Terrorist', 'en', {}, 'General', toTimestamp(now()));
INSERT INTO fortis.watchlist (topicid, topic, lang_code, translations, category, insertiontime) VALUES (uuid(), 'New York', 'en', {}, 'General', toTimestamp(now()));
INSERT INTO fortis.watchlist (topicid, topic, lang_code, translations, category, insertiontime) VALUES (uuid(), 'NYC', 'en', {}, 'General', toTimestamp(now()));
INSERT INTO fortis.watchlist (topicid, topic, lang_code, translations, category, insertiontime) VALUES (uuid(), 'Trump', 'en', {}, 'General', toTimestamp(now()));
INSERT INTO fortis.watchlist (topicid, topic, lang_code, translations, category, insertiontime) VALUES (uuid(), 'Houston', 'en', {}, 'General', toTimestamp(now()));
INSERT INTO fortis.watchlist (topicid, topic, lang_code, translations, category, insertiontime) VALUES (uuid(), 'Flynt', 'en', {}, 'General', toTimestamp(now()));
