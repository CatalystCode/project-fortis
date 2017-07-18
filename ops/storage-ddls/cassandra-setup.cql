CREATE KEYSPACE IF NOT EXISTS fortis
   WITH replication = {'class':'SimpleStrategy', 'replication_factor' : 3};

USE fortis;

DROP TABLE IF EXISTS watchlist;
CREATE TABLE watchlist(
    topicid uuid,
    topic text,
    lang_code text,
    translations map<text, text>,
    insertion_time timestamp,
    PRIMARY KEY (topic, lang_code)
);

DROP TABLE IF EXISTS blacklist;
CREATE TABLE blacklist(
    id uuid,
    conjunctivefilter frozen<list<text>>,
    PRIMARY KEY (id)
);

DROP TABLE IF EXISTS sitesettings;
CREATE TABLE sitesettings(
    sitename text,
    geofence list<double>,
    languages set<text>,
    defaultzoom int,
    title text,
    logo text,
    translationsvctoken text,
    cogspeechsvctoken text,
    cogvisionsvctoken text,
    cogtextsvctoken text,
    insertion_time timestamp,
    PRIMARY KEY (sitename)
);

DROP TABLE IF EXISTS streams;
CREATE TABLE streams (
    streamid uuid,
    pipelinekey text,
    pipelinelabel text,
    pipelineicon text,
    streamfactory text,
    params frozen<map<text, text>>,
    PRIMARY KEY (pipelinekey, streamid)
);

DROP TABLE IF EXISTS trustedsources;
CREATE TABLE trustedsources (   
   externalsourceid text,
   sourcetype text,
   pipelinekey text,
   rank int,
   insertion_time timestamp,
   PRIMARY KEY (pipelinekey, externalsourceid, sourcetype, rank)
);

DROP TABLE IF EXISTS events;
DROP TYPE IF EXISTS features;
DROP TYPE IF EXISTS computedsentiment;
CREATE TYPE computedsentiment (
    pos_avg float,
    neg_avg float
);

DROP TYPE IF EXISTS computedgender;
CREATE TYPE computedgender (
    male_mentions int,
    female_mentions int
);

DROP TYPE IF EXISTS computedentities;
CREATE TYPE computedentities (
    name text,
    externalsource text,
    externalrefid text,
    count float
);

CREATE TYPE features (
    mentions int,
    sentiment frozen<computedsentiment>,
    gender frozen<computedgender>,
    entities frozen<set<computedentities>>
);

DROP TABLE IF EXISTS conjunctivetopics;
CREATE TABLE conjunctivetopics (
    topic text,
    conjunctivetopic text,
    mentions int,
    PRIMARY KEY(topic, mentions, conjunctivetopic)
) WITH CLUSTERING ORDER BY(mentions DESC);

DROP TABLE IF EXISTS populartopics;
CREATE TABLE populartopics (
    periodstartdate timestamp,
    periodenddate timestamp,
    periodtype text,
    pipelinekey text,
    period text,
    tilez int,
    tilex int,
    tiley int,
    externalsourceid text,
    topic text,
    mentionCount int,
    insertion_time timestamp,
    PRIMARY KEY ((periodtype, pipelinekey, externalsourceid, tilez, topic, period), tilex, tiley, periodstartdate, periodenddate)
);

DROP MATERIALIZED VIEW IF EXISTS popularsources;
DROP MATERIALIZED VIEW IF EXISTS timeseries;
DROP TABLE IF EXISTS computedtiles;
CREATE TABLE computedtiles (
    periodstartdate timestamp,
    periodenddate timestamp,
    periodtype text,
    pipelinekey text,
    period text,
    tilez int,
    tilex int,
    tiley int,
    externalsourceid text,
    mentioncount int,
    avgsentiment int,
    heatmap text,
    placeids frozen<set<text>>,
    insertion_time timestamp,
    conjunctiontopics tuple<text, text, text>,
    PRIMARY KEY ((periodtype, conjunctiontopics, tilez, period), tilex, tiley, periodstartdate, periodenddate, pipelinekey, externalsourceid)
);

CREATE MATERIALIZED VIEW popularsources
AS SELECT periodtype, conjunctiontopics, tilez, externalsourceid, period, pipelinekey, conjunctiontopics, periodtype, tilez, period, tilex, tiley, periodstartdate, periodenddate, mentioncount
   FROM computedtiles
   WHERE periodtype IS NOT NULL AND conjunctiontopics IS NOT NULL AND tilez IS NOT NULL AND externalsourceid IS NOT NULL AND period IS NOT NULL AND pipelinekey IS NOT NULL AND conjunctiontopics IS NOT NULL AND periodtype IS NOT NULL AND tilez IS NOT NULL AND period IS NOT NULL AND tilex IS NOT NULL AND tiley IS NOT NULL AND periodstartdate IS NOT NULL AND periodenddate IS NOT NULL
PRIMARY KEY ((periodtype, conjunctiontopics, tilez, externalsourceid, period), tilex, tiley, periodstartdate, periodenddate, pipelinekey);

CREATE MATERIALIZED VIEW timeseries
AS SELECT periodtype, conjunctiontopics, tilez, externalsourceid, period, pipelinekey, conjunctiontopics, periodtype, tilez, period, tilex, tiley, periodstartdate, periodenddate, mentioncount, avgsentiment
   FROM computedtiles
   WHERE periodtype IS NOT NULL AND conjunctiontopics IS NOT NULL AND tilez IS NOT NULL AND externalsourceid IS NOT NULL AND period IS NOT NULL AND pipelinekey IS NOT NULL AND conjunctiontopics IS NOT NULL AND periodtype IS NOT NULL AND tilez IS NOT NULL AND period IS NOT NULL AND tilex IS NOT NULL AND tiley IS NOT NULL AND periodstartdate IS NOT NULL AND periodenddate IS NOT NULL
PRIMARY KEY ((periodtype, conjunctiontopics, tilez, period), tilex, tiley, pipelinekey, externalsourceid, periodstartdate, periodenddate);

DROP TABLE IF EXISTS popularplaces;
CREATE TABLE popularplaces (
    periodstartdate timestamp,
    periodenddate timestamp,
    periodtype text,
    period text,
    pipelinekey text,
    externalsourceid text,
    placename text,
    placeid text,
    placecentroidcoordx double,
    placecentroidcoordy double,
    conjunctiontopics tuple<text, text, text>,
    mentioncount int,
    insertion_time timestamp,
    PRIMARY KEY ((period, periodtype, pipelinekey, externalsourceid, conjunctiontopics), mentioncount, periodstartdate, periodenddate, placecentroidcoordx, placecentroidcoordy)
) WITH CLUSTERING ORDER BY (mentioncount DESC, periodstartdate DESC, periodenddate DESC, placecentroidcoordx DESC, placecentroidcoordy DESC);

DROP TABLE IF EXISTS eventtags;
CREATE TABLE eventtags(
    eventid uuid,
    topic text,
    placeid text,
    placecentroidcoordx double,
    placecentroidcoordy double,
    event_time timestamp,
    pipelinekey text,
    externalsourceid text,
    PRIMARY KEY (topic, pipelinekey, event_time, placecentroidcoordx, placecentroidcoordy, eventid)
) WITH CLUSTERING ORDER BY (pipelinekey DESC, event_time ASC);

CREATE TABLE events(
    eventid uuid,
    externalid text,
    pipelinekey text,
    title text,
    sourceurl text,
    externalsourceid text,
    eventlangcode text,
    messagebody text,
    computedfeatures frozen<features>,
    insertion_time timestamp,
    event_time timestamp,
    PRIMARY KEY ((pipelinekey, eventid), event_time)
) WITH CLUSTERING ORDER BY (event_time ASC);

CREATE CUSTOM INDEX ON events (messagebody) USING 'org.apache.cassandra.index.sasi.SASIIndex'
WITH OPTIONS = {
'mode': 'CONTAINS',
'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.StandardAnalyzer',
'analyzed': 'true',
'tokenization_enable_stemming': 'true',
'tokenization_normalize_lowercase': 'true'
};

CREATE CUSTOM INDEX ON events (title) USING 'org.apache.cassandra.index.sasi.SASIIndex'
WITH OPTIONS = {
'mode': 'CONTAINS',
'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.StandardAnalyzer',
'analyzed': 'true',
'tokenization_enable_stemming': 'true',
'tokenization_normalize_lowercase': 'true'
};
