DROP KEYSPACE IF EXISTS settings;
CREATE KEYSPACE settings WITH replication = {
    'class': 'SimpleStrategy',
    'replication_factor': 3
};

-- *****************************************************************************
-- * Down migration
-- *****************************************************************************

DROP TABLE IF EXISTS settings.users;
DROP TABLE IF EXISTS settings.watchlist;
DROP TABLE IF EXISTS settings.blacklist;
DROP TABLE IF EXISTS settings.sitesettings;
DROP TABLE IF EXISTS settings.streams;
DROP TABLE IF EXISTS settings.trustedsources;

-- *****************************************************************************
-- * Configuration tables
-- *****************************************************************************

CREATE TABLE settings.users(
    identifier text,
    role text,
    PRIMARY KEY ((identifier, role))
);

CREATE TABLE settings.watchlist(
    topicid uuid,
    topic text,
    lang_code text,
    translations_json text,
    category text,
    insertiontime timestamp,
    PRIMARY KEY ((topic, lang_code), category)
);

CREATE TABLE settings.blacklist(
    id uuid,
    conjunctivefilter_json text,
    islocation boolean,
    PRIMARY KEY (id)
);

CREATE TABLE settings.sitesettings(
    sitename text,
    geofence_json text,
    languages_json text,
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

CREATE TABLE settings.streams (
    streamid uuid,
    pipelinekey text,
    pipelinelabel text,
    pipelineicon text,
    streamfactory text,
    params_json text,
    enabled boolean,
    PRIMARY KEY (pipelinekey, streamid)
);

CREATE TABLE settings.trustedsources (
   externalsourceid text,
   sourcetype text,
   pipelinekey text,
   rank int,
   displayname text,
   reportingcategory text,
   insertiontime timestamp,
   PRIMARY KEY (pipelinekey, externalsourceid, sourcetype, rank)
);
