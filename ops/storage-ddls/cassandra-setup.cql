CREATE KEYSPACE fortis
   WITH replication = {'class':'SimpleStrategy', 'replication_factor' : 3};

USE fortis;

CREATE TABLE watchlist(
    keyword text,
    lang_code text,
    translations map<text, text>,
    insertion_time timestamp,
    PRIMARY KEY (keyword, lang_code)
);

CREATE TABLE blacklist(
    id uuid,
    conjunctivefilter frozen<list<text>>,
    PRIMARY KEY (id)
);

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

CREATE TABLE streams (
  streamid uuid,
  pipelinekey text,
  pipelinelabel text,
  pipelineicon text,
  streamfactory text,
  params frozen<map<text, text>>,
  PRIMARY KEY (pipelinekey, streamid)
);

CREATE TABLE trustedsources (
   externalsourceid text,
   sourcetype text,
   streamfactory text,
   rank int,
   insertion_time timestamp,
   PRIMARY KEY (pipelinekey, externalsourceid, sourcetype, rank)
);

CREATE TYPE computedsentiment (
    pos_avg float,
    neg_avg float
);

CREATE TYPE computedgender (
    male_mentions int,
    female_mentions int
);

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

CREATE TABLE computedtiles (
    tileid text,
    tilex int,
    tiley int,
    tilez int,
    periodstartdate timestamp,
    periodenddate timestamp,
    periodtype text,
    period text,
    pipelinekey text,
    externalsourceid text,
    topicconjunctionid uuid,
    insertion_time timestamp,
    heatmap text,
    placeids frozen<set<text>>,
    computedfeatures frozen<features>,
    PRIMARY KEY ((period, periodtype, pipelinekey, topicconjunctionid), externalsourceid, tilez, tilex, tiley, periodstartdate, periodenddate)
);

create table topicconjunctions(
    topic text,
    topicconjunctionid uuid,
    conjunctivekeywordcombination map<text, int>,//map value is representative of the aggregated mention count displayed in the dashboard
    PRIMARY KEY (topic, topicconjunctionid)
);

CREATE INDEX ON topicconjunctions ( KEYS (conjunctivekeywordcombination) );

CREATE TABLE computedplaces (
    placeid text,
    periodstartdate timestamp,
    periodenddate timestamp,
    periodtype text,
    period text,
    pipelinekey text,
    externalsourceid text,
    topicconjunctionid uuid,
    insertion_time timestamp,
    computedfeatures frozen<features>,
    PRIMARY KEY ((period, periodtype, pipelinekey, topicconjunctionid, placeid), externalsourceid, periodstartdate, periodenddate)
);

CREATE TABLE populartopics (
    periodstartdate timestamp,
    periodenddate timestamp,
    periodtype text,
    period text,
    pipelinekey text,
    externalsourceid text,
    topic text,
    topiclangcode text,
    mentionCount int,
    insertion_time timestamp,
    PRIMARY KEY ((period, periodtype, pipelinekey, externalsourceid, topiclangcode), mentionCount, periodstartdate, periodenddate, topic)
) WITH CLUSTERING ORDER BY (mentionCount DESC, periodstartdate DESC, periodenddate DESC, topic ASC);

CREATE TABLE popularsources (
    periodstartdate timestamp,
    periodenddate timestamp,
    periodtype text,
    period text,
    pipelinekey text,
    externalsourceid text,
    topicconjunctionid uuid,
    mentionCount int,
    insertion_time timestamp,
    PRIMARY KEY ((period, periodtype, pipelinekey, topicconjunctionid), mentionCount, periodstartdate, periodenddate, externalsourceid)
) WITH CLUSTERING ORDER BY (mentionCount DESC, periodstartdate DESC, periodenddate DESC, externalsourceid ASC);

CREATE TABLE popularplaces (
    periodstartdate timestamp,
    periodenddate timestamp,
    periodtype text,
    period text,
    pipelinekey text,
    externalsourceid text,
    placename text,
    placeid int,
    topicconjunctionid uuid,
    mentionCount int,
    insertion_time timestamp,
    PRIMARY KEY ((period, periodtype, pipelinekey, topicconjunctionid, externalsourceid), mentionCount, periodstartdate, periodenddate, placename)
) WITH CLUSTERING ORDER BY (mentionCount DESC, periodstartdate DESC, periodenddate DESC, placename ASC);

CREATE TABLE events(
    id uuid,
    externalid text,
    pipelinekey text,
    title text,
    sourceurl text,
    detectedplaceids frozen<set<text>>,
    externalsourceid text,
    topicconjunctionids set<text>,
    eventlangcode text,
    messagebody text,
    computedfeatures frozen<features>,
    insertion_time timestamp,
    event_time timestamp,
    PRIMARY KEY ((pipelinekey, eventlangcode), externalid)
);

CREATE CUSTOM INDEX ON events (messagebody) USING 'org.apache.cassandra.index.sasi.SASIIndex'
WITH OPTIONS = {
'mode': 'CONTAINS',
'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.StandardAnalyzer',
'analyzed': 'true',
'tokenization_skip_stop_words': 'and, the, or',
'tokenization_enable_stemming': 'true',
'tokenization_normalize_lowercase': 'true',
'tokenization_locale': 'en'
};

CREATE CUSTOM INDEX ON events (title) USING 'org.apache.cassandra.index.sasi.SASIIndex'
WITH OPTIONS = {
'mode': 'CONTAINS',
'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.StandardAnalyzer',
'analyzed': 'true',
'tokenization_skip_stop_words': 'and, the, or',
'tokenization_enable_stemming': 'true',
'tokenization_normalize_lowercase': 'true',
'tokenization_locale': 'en'
};

CREATE INDEX ON events (topicconjunctionids);