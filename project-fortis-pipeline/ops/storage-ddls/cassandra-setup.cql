DROP KEYSPACE IF EXISTS fortis;
CREATE KEYSPACE fortis WITH replication = {
    'class': 'SimpleStrategy',
    'replication_factor': 3
};

// *****************************************************************************
// * Down migration
// *****************************************************************************

DROP MATERIALIZED VIEW IF EXISTS fortis.eventbatches;
DROP MATERIALIZED VIEW IF EXISTS fortis.popularsources;
DROP MATERIALIZED VIEW IF EXISTS fortis.populartopics;
DROP MATERIALIZED VIEW IF EXISTS fortis.eventplacesbysource;
DROP INDEX IF EXISTS fortis.events_fulltext_idx;

DROP TABLE IF EXISTS fortis.users;
DROP TABLE IF EXISTS fortis.watchlist;
DROP TABLE IF EXISTS fortis.blacklist;
DROP TABLE IF EXISTS fortis.sitesettings;
DROP TABLE IF EXISTS fortis.streams;
DROP TABLE IF EXISTS fortis.trustedsources;
DROP TABLE IF EXISTS fortis.conjunctivetopics;
DROP TABLE IF EXISTS fortis.computedtiles;
DROP TABLE IF EXISTS fortis.heatmap;
DROP TABLE IF EXISTS fortis.popularplaces;
DROP TABLE IF EXISTS fortis.eventplaces;
DROP TABLE IF EXISTS fortis.events;
DROP TABLE IF EXISTS fortis.computedtrends;

DROP TYPE IF EXISTS fortis.features;
DROP TYPE IF EXISTS fortis.computedgender;
DROP TYPE IF EXISTS fortis.sentiment;
DROP TYPE IF EXISTS fortis.computedentities;
DROP TYPE IF EXISTS fortis.place;

// *****************************************************************************
// * Types
// *****************************************************************************

CREATE TYPE fortis.computedgender (
    male_mentions bigint,
    female_mentions bigint
);

CREATE TYPE fortis.sentiment (
    neg_avg double
);

CREATE TYPE fortis.computedentities (
    name text,
    externalsource text,
    externalrefid text,
    count bigint
);

CREATE TYPE fortis.place (
    placeid text,
    centroidlat double,
    centroidlon double
);

CREATE TYPE fortis.features (
    mentions bigint,
    sentiment frozen<fortis.sentiment>,
    entities frozen<list<fortis.computedentities>>,
    keywords frozen<list<text>>,
    places frozen<list<fortis.place>>
);

// *****************************************************************************
// * Configuration tables
// *****************************************************************************

CREATE TABLE fortis.users(
    identifier text,
    role text,
    PRIMARY KEY ((identifier, role))
);

CREATE TABLE fortis.watchlist(
    topicid uuid,
    topic text,
    lang_code text,
    translations map<text, text>,
    category text,
    insertiontime timestamp,
    PRIMARY KEY ((topic, lang_code), category)
);

CREATE TABLE fortis.blacklist(
    id uuid,
    conjunctivefilter frozen<list<text>>,
    islocation boolean,
    PRIMARY KEY (id)
);

CREATE TABLE fortis.sitesettings(
    sitename text,
    geofence list<double>,
    languages set<text>,
    defaultlanguage text,
    defaultzoom int,
    featureservicenamespace text,
    title text,
    logo text,
    mapsvctoken text,
    translationsvctoken text,
    cogspeechsvctoken text,
    cogvisionsvctoken text,
    cogtextsvctoken text,
    insertiontime timestamp,
    PRIMARY KEY (sitename)
);

CREATE TABLE fortis.streams (
    streamid uuid,
    pipelinekey text,
    pipelinelabel text,
    pipelineicon text,
    streamfactory text,
    params frozen<map<text, text>>,
    enabled boolean,
    PRIMARY KEY (pipelinekey, streamid)
);

CREATE TABLE fortis.trustedsources (
   externalsourceid text,
   sourcetype text,
   pipelinekey text,
   rank int,
   displayname text,
   reportingcategory text,
   insertiontime timestamp,
   PRIMARY KEY (pipelinekey, externalsourceid, sourcetype, rank)
);

// *****************************************************************************
// * Data tables
// *****************************************************************************

CREATE TABLE fortis.computedtiles (
    perioddate timestamp,
    periodtype text,
    pipelinekey text,
    tilez int,
    tileid text,
    externalsourceid text,
    mentioncount bigint,
    avgsentimentnumerator bigint,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    PRIMARY KEY ((periodtype, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, pipelinekey, externalsourceid, tileid), perioddate)
);

CREATE TABLE fortis.heatmap (
    perioddate timestamp,
    periodtype text,
    pipelinekey text,
    tilez int,
    tileid text,
    heatmaptileid text,
    externalsourceid text,
    mentioncount counter,
    avgsentimentnumerator counter,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    PRIMARY KEY ((periodtype, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, pipelinekey, externalsourceid, tileid), perioddate, heatmaptileid)
);

CREATE TABLE fortis.popularplaces (
    perioddate timestamp,
    periodtype text,
    pipelinekey text,
    externalsourceid text,
    placeid text,
    tilez int,
    tileid text,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    mentioncount counter,
    avgsentimentnumerator counter,
    PRIMARY KEY ((periodtype, pipelinekey, externalsourceid, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, tileid), perioddate, placeid)
);

CREATE TABLE fortis.conjunctivetopics (
    perioddate timestamp,
    periodtype text,
    pipelinekey text,
    tilez int,
    tileid text,
    externalsourceid text,
    topic text,
    conjunctivetopic text,
    mentioncount counter,
    PRIMARY KEY ((periodtype, pipelinekey, externalsourceid, tilez, topic, tileid), perioddate, conjunctivetopic)
);

CREATE TABLE fortis.eventplaces(
    eventid text,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    tileid text,
    tilez int,
    centroidlat double,
    centroidlon double,
    placeid text,
    insertiontime timestamp,
    eventtime timestamp,
    pipelinekey text,
    externalsourceid text,
    PRIMARY KEY ((conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, pipelinekey, tilez, tileid), eventtime, eventid, placeid)
) WITH CLUSTERING ORDER BY (eventtime DESC);

CREATE TABLE fortis.computedtrends(
    topic text,
    pipelinekey text,
    periodstartdate timestamp,
    periodtype text,
    period text,
    tilez int,
    tilex int,
    tiley int,
    score float,
    insertion_time timestamp,
    PRIMARY KEY ((pipelinekey, periodtype, tilez, period), topic, tilex, tiley)
) WITH CLUSTERING ORDER BY (topic ASC, tilex ASC, tiley ASC);

CREATE TABLE fortis.events(
    eventid text,
    sourceeventid text,
    batchid uuid,
    pipelinekey text,
    title text,
    sourceurl text,
    externalsourceid text,
    eventlangcode text,
    body text,
    imageurl text,
    summary text,
    computedfeatures frozen<fortis.features>,
    insertiontime timestamp,
    eventtime timestamp,
    topics frozen<set<text>>,
    placeids frozen<set<text>>,
    fulltext text, /* conjunction of title and body to enable querying of both at the same time */
    PRIMARY KEY (eventid)
);

// *****************************************************************************
// * Views
// *****************************************************************************

CREATE MATERIALIZED VIEW fortis.populartopics
AS SELECT periodtype, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, externalsourceid, pipelinekey, tilez, 
          tileid, perioddate, mentioncount, avgsentimentnumerator
   FROM fortis.computedtiles
   WHERE periodtype IS NOT NULL
     AND conjunctiontopic1 IS NOT NULL
     AND conjunctiontopic2 = ''
     AND conjunctiontopic3 = ''
     AND avgsentimentnumerator IS NOT NULL
     AND mentioncount IS NOT NULL
     AND externalsourceid IS NOT NULL
     AND pipelinekey IS NOT NULL
     AND tilez IS NOT NULL
     AND tileid IS NOT NULL
     AND perioddate IS NOT NULL
PRIMARY KEY ((periodtype, externalsourceid, tilez, pipelinekey, tileid, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3), perioddate, mentioncount)
WITH CLUSTERING ORDER BY (perioddate DESC, mentioncount DESC);

CREATE MATERIALIZED VIEW fortis.eventplacesbysource
AS SELECT eventid, pipelinekey, eventtime, centroidlat, centroidlon, placeid, conjunctiontopic1, 
          conjunctiontopic2, conjunctiontopic3, externalsourceid, tileid, tilez
   FROM fortis.eventplaces
   WHERE eventid IS NOT NULL
     AND pipelinekey IS NOT NULL
     AND eventtime IS NOT NULL
     AND tileid IS NOT NULL
     AND tilez IS NOT NULL
     AND placeid IS NOT NULL
     AND externalsourceid IS NOT NULL
     AND conjunctiontopic1 IS NOT NULL
     AND conjunctiontopic2 IS NOT NULL
     AND conjunctiontopic3 IS NOT NULL
     AND centroidlat IS NOT NULL
     AND centroidlon IS NOT NULL
PRIMARY KEY ((conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, pipelinekey, tilez, externalsourceid, tileid), eventtime, placeid, eventid);

// Allows for linking the batchid to saveToCassandra spark call so we can filter out dupes from the original rdd.
CREATE MATERIALIZED VIEW fortis.eventbatches
AS SELECT batchid, eventid
   FROM fortis.events
   WHERE batchid IS NOT NULL
     AND eventid IS NOT NULL
PRIMARY KEY (batchid, eventid);

CREATE MATERIALIZED VIEW fortis.popularsources
AS SELECT periodtype, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, externalsourceid, pipelinekey, 
          tileid, perioddate, mentioncount, avgsentimentnumerator
   FROM fortis.computedtiles
   WHERE periodtype IS NOT NULL
     AND conjunctiontopic1 IS NOT NULL
     AND conjunctiontopic2 IS NOT NULL
     AND conjunctiontopic3 IS NOT NULL
     AND avgsentimentnumerator IS NOT NULL
     AND mentioncount IS NOT NULL
     AND externalsourceid IS NOT NULL
     AND pipelinekey IS NOT NULL
     AND tilez IS NOT NULL
     AND tileid IS NOT NULL
     AND perioddate IS NOT NULL
PRIMARY KEY ((periodtype, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, pipelinekey, tileid), perioddate, mentioncount, externalsourceid)
WITH CLUSTERING ORDER BY (perioddate DESC, mentioncount DESC);

CREATE MATERIALIZED VIEW fortis.eventsbypipeline
AS SELECT eventid, pipelinekey, eventtime,conjunctiontopic3,conjunctiontopic2,tilez,tileid,placeid,conjunctiontopic1
   FROM fortis.eventplaces
   WHERE eventid IS NOT NULL
     AND pipelinekey IS NOT NULL
     AND eventtime IS NOT NULL
     AND conjunctiontopic1 IS NOT NULL
     AND conjunctiontopic2 = ''
     AND conjunctiontopic3 = ''
     AND tilez = 15
     AND tileid IS NOT NULL
     AND placeid IS NOT NULL
PRIMARY KEY ((pipelinekey, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez), eventtime, eventid, tileid, placeid)
WITH CLUSTERING ORDER BY (eventtime DESC);

// *****************************************************************************
// * Indices
// *****************************************************************************

CREATE CUSTOM INDEX ON fortis.events (fulltext) USING 'org.apache.cassandra.index.sasi.SASIIndex'
WITH OPTIONS = {
'mode': 'CONTAINS',
'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.StandardAnalyzer',
'analyzed': 'true',
'tokenization_enable_stemming': 'true',
'tokenization_normalize_lowercase': 'true'
};
