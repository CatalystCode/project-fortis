insert into streams (streamid, pipelinekey, pipelinelabel, streamfactory, params) values (uuid(), 'instagram', 'Instagram', 'InstagramTag', {'connName':'Test'});
insert into streams (streamid, pipelinekey, pipelinelabel, streamfactory, params) values (uuid(), 'instagram', 'Instagram', 'InstagramLocation', {'connName':'Test'});

select * from streams where pipelinekey = 'instagram';

 pipelinekey | streamfactory     | params               | pipelineicon | pipelinelabel
-------------+-------------------+----------------------+--------------+---------------
   instagram | InstagramLocation | {'connName': 'Test'} |         null |     Instagram
   instagram |      InstagramTag | {'connName': 'Test'} |         null |     Instagram

(2 rows)

insert into trustedsources (externalsourceid, sourcetype, pipelinekey, rank, insertion_time) values ('@bloomberg', 'profile', 'twitter', 1, dateof(now()));
insert into trustedsources (externalsourceid, sourcetype, pipelinekey, rank, insertion_time) values ('kevhartman', 'profile', ' ', 1, dateof(now()));
cassandra@cqlsh:fortis> select * from trustedsources where pipelinekey = 'twitter' ;

 pipelinekey | externalsourceid | sourcetype | rank | insertion_time
-------------+------------------+------------+------+---------------------------------
     twitter |       @aljazeera |    profile |    1 | 2017-07-12 02:19:15.922000+0000
     twitter |       @bloomberg |    profile |    1 | 2017-07-12 02:20:23.430000+0000
     twitter |             @cnn |    profile |    2 | 2017-07-12 02:19:40.007000+0000


insert into computedtiles (tileid, tilex, tiley, tilez, periodstartdate, periodenddate, periodtype, period, pipeline, sourceid, topicconjunctionid) VALUES ('100_105_16', 100, 106, 16, '2017-06-01', '2017-06-30', 'month', 'month-2017-06', 'all', 'all', facd7900-55cb-4fc5-844a-555c354cfe02);

 select * from computedtiles where period = 'month-2017-06' and periodtype = 'month' and topicconjunctionid = facd7900-55cb-4fc5-844a-555c354cfe02 and pipeline = 'all' and tilez = 16 and sourceid='all' and (tilex, tiley, periodstartdate, periodenddate) >= (100, 105, '2017-06-01', '2017-06-01') and (tilex, tiley, periodstartdate, periodenddate) <= (100, 302, '2017-06-30', '2017-06-30');

//Pull all the conjunctive filter combinations for the most popular topic
insert into topicconjunctions(topic, topicconjunctionid, conjunctivekeywordcombination) values ('isis', uuid(), {'bomb': 123, 'terror': 100, 'car': 834});

select * from topicconjunctions where topic = 'isis';

insert into computedplaces (placeid, periodstartdate, periodenddate, periodtype, period, pipelinekey, externalsourceid, topicconjunctionid, placename) VALUES ('232344', '2017-06-01', '2017-06-30', 'month', 'month-2017-06', 'all', 'all', facd7900-55cb-4fc5-844a-555c354cfe02, 'london';

insert into computedplaces (placeid, periodstartdate, periodenddate, periodtype, period, pipelinekey, externalsourceid, topicconjunctionid, placename) VALUES ('34345', '2017-06-01', '2017-06-30', 'month', 'month-2017-06', 'all', 'all', facd7900-55cb-4fc5-844a-555c354cfe02, 'sydney');

 select * from computedplaces where period = 'month-2017-06' and periodtype = 'month' and topicconjunctionid = facd7900-55cb-4fc5-844a-555c354cfe02 and pipelinekey = 'all' and externalsourceid='all' and placeid IN('34345') and (periodstartdate, periodenddate) >= ('2017-06-01', '2017-06-01') and (periodstartdate, periodenddate) <= ('2017-06-30', '2017-06-30');

insert into populartopics (topic, topiclangcode, periodstartdate, periodenddate, periodtype, period, pipelinekey, externalsourceid, mentionCount, insertion_time) values ('elections', 'en', '2017-06-01', '2017-06-30', 'month', 'month-2017-06', 'all', 'all', 400, dateof(now()));

insert into populartopics (topic, topiclangcode, periodstartdate, periodenddate, periodtype, period, pipelinekey, externalsourceid, mentionCount, insertion_time) values ('isis', 'en', '2017-06-01', '2017-06-30', 'month', 'month-2017-06', 'all', 'all', 100, dateof(now()));

select * from populartopics where topiclangcode = 'en' and period = 'month-2017-06' and periodtype = 'month' and pipelinekey = 'all' and externalsourceid = 'all' and (mentionCount, periodstartdate, periodenddate) >= (1, '2017-06-01', '2017-06-01') and (mentionCount, periodstartdate, periodenddate) <= (100000, '2017-06-30', '2017-06-30') LIMIT 1;

insert into popularsources (periodstartdate, periodenddate, periodtype, period, externalsourceid, pipelinekey, mentionCount, topicconjunctionid, insertion_time) values ('2017-06-01', '2017-06-30', 'month', 'month-2017-06', '@al jazeera', 'twitter', 400, facd7900-55cb-4fc5-844a-555c354cfe02, dateof(now()));

insert into popularsources (periodstartdate, periodenddate, periodtype, period, externalsourceid, pipelinekey, mentionCount, topicconjunctionid, insertion_time) values ('2017-06-01', '2017-06-30', 'month', 'month-2017-06', '@bloomberg', 'twitter', 250, facd7900-55cb-4fc5-844a-555c354cfe02, dateof(now()));

insert into popularsources (periodstartdate, periodenddate, periodtype, period, externalsourceid, pipelinekey, mentionCount, topicconjunctionid, insertion_time) values ('2017-06-01', '2017-06-30', 'month', 'month-2017-06', '@reuters', 'twitter', 250, facd7900-55cb-4fc5-844a-555c354cfe02, dateof(now()));

select * from popularsources where period = 'month-2017-06' and periodtype = 'month' and pipelinekey = 'twitter' and topicconjunctionid = facd7900-55cb-4fc5-844a-555c354cfe02 and (mentionCount, periodstartdate, periodenddate) >= (1, '2017-06-01', '2017-06-01') and (mentionCount, periodstartdate, periodenddate) <= (100000, '2017-06-30', '2017-06-30') LIMIT 1;

select * from popularplaces where period = 'month-2017-06' and periodtype = 'month' and pipelinekey = 'all' and externalsourceid = 'all' and topicconjunctionid = facd7900-55cb-4fc5-844a-555c354cfe02 and (mentionCount, periodstartdate, periodenddate) >= (1, '2017-06-01', '2017-06-01') and (mentionCount, periodstartdate, periodenddate) <= (100000, '2017-06-30', '2017-06-30') LIMIT 1;

select * from events where pipelinekey = 'twitter' and eventlangcode = 'en' and topicconjunctionids CONTAINS 'facd7900-55cb-4fc5-844a-555c354cfe02';