cassandra@cqlsh:fortis> insert into streams (pipelinekey,pipelinelabel,connectorid,params) values ('twitter', 'Twitter', uuid(), {'connName':'Test'});
cassandra@cqlsh:fortis> select * from streams where pipelinekey = 'twitter';

 pipelinekey | connectorid                          | params               | pipelinelabel
-------------+--------------------------------------+----------------------+---------------
     twitter | 7a6232bc-7a25-43fd-b34d-4eb40490814e | {'connName': 'Test'} |       Twitter

(1 rows)

cassandra@cqlsh:fortis> insert into trustedsources (externalsourceid, sourcetype, pipelinekey, rank, insertion_time) values ('@bloomberg', 'profile', 'twitter', 1, dateof(now()));
cassandra@cqlsh:fortis> select * from trustedsources where pipelinekey = 'twitter' ;

 pipelinekey | externalsourceid | sourcetype | rank | insertion_time
-------------+------------------+------------+------+---------------------------------
     twitter |       @aljazeera |    profile |    1 | 2017-07-12 02:19:15.922000+0000
     twitter |       @bloomberg |    profile |    1 | 2017-07-12 02:20:23.430000+0000
     twitter |             @cnn |    profile |    2 | 2017-07-12 02:19:40.007000+0000


insert into computedtiles (tileid, tilex, tiley, tilez, periodstartdate, periodenddate, periodtype, period, pipeline, sourceid, topiconjunctionid) VALUES ('100_105_16', 100, 106, 16, '2017-06-01', '2017-06-30', 'month', 'month-2017-06', 'all', 'all', facd7900-55cb-4fc5-844a-555c354cfe02);

 select * from computedtiles where period = 'month-2017-06' and periodtype = 'month' and topiconjunctionid = facd7900-55cb-4fc5-844a-555c354cfe02 and pipeline = 'all' and tilez = 16 and sourceid='all' and (tilex, tiley, periodstartdate, periodenddate) >= (100, 105, '2017-06-01', '2017-06-01') and (tilex, tiley, periodstartdate, periodenddate) <= (100, 302, '2017-06-30', '2017-06-30');

//Pull all the conjunctive filter combinations for the most popular topic
select * from topiconjunctions where topic = 'isis';

insert into computedplaces (placeid, periodstartdate, periodenddate, periodtype, period, pipelinekey, externalsourceid, topiconjunctionid, placename) VALUES ('232344', '2017-06-01', '2017-06-30', 'month', 'month-2017-06', 'all', 'all', facd7900-55cb-4fc5-844a-555c354cfe02, 'london';

insert into computedplaces (placeid, periodstartdate, periodenddate, periodtype, period, pipelinekey, externalsourceid, topiconjunctionid, placename) VALUES ('34345', '2017-06-01', '2017-06-30', 'month', 'month-2017-06', 'all', 'all', facd7900-55cb-4fc5-844a-555c354cfe02, 'sydney');

 select * from computedplaces where period = 'month-2017-06' and periodtype = 'month' and topiconjunctionid = facd7900-55cb-4fc5-844a-555c354cfe02 and pipelinekey = 'all' and externalsourceid='all' and placeid IN('34345') and (periodstartdate, periodenddate) >= ('2017-06-01', '2017-06-01') and (periodstartdate, periodenddate) <= ('2017-06-30', '2017-06-30');

insert into populartopics (topic, topiclangcode, periodstartdate, periodenddate, periodtype, period, pipelinekey, externalsourceid, mentionCount, insertion_time) values ('elections', 'en', '2017-06-01', '2017-06-30', 'month', 'month-2017-06', 'all', 'all', 400, dateof(now()));

insert into populartopics (topic, topiclangcode, periodstartdate, periodenddate, periodtype, period, pipelinekey, externalsourceid, mentionCount, insertion_time) values ('isis', 'en', '2017-06-01', '2017-06-30', 'month', 'month-2017-06', 'all', 'all', 100, dateof(now()));

select * from populartopics where topiclangcode = 'en' and period = 'month-2017-06' and periodtype = 'month' and pipelinekey = 'all' and externalsourceid = 'all' and (mentionCount, periodstartdate, periodenddate) >= (1, '2017-06-01', '2017-06-01') and (mentionCount, periodstartdate, periodenddate) <= (100000, '2017-06-30', '2017-06-30') LIMIT 1;

insert into popularsources (periodstartdate, periodenddate, periodtype, period, externalsourceid, pipelinekey, mentionCount, topiconjunctionid, insertion_time) values ('2017-06-01', '2017-06-30', 'month', 'month-2017-06', '@al jazeera', 'twitter', 400, facd7900-55cb-4fc5-844a-555c354cfe02, dateof(now()));

insert into popularsources (periodstartdate, periodenddate, periodtype, period, externalsourceid, pipelinekey, mentionCount, topiconjunctionid, insertion_time) values ('2017-06-01', '2017-06-30', 'month', 'month-2017-06', '@bloomberg', 'twitter', 250, facd7900-55cb-4fc5-844a-555c354cfe02, dateof(now()));

insert into popularsources (periodstartdate, periodenddate, periodtype, period, externalsourceid, pipelinekey, mentionCount, topiconjunctionid, insertion_time) values ('2017-06-01', '2017-06-30', 'month', 'month-2017-06', '@reuters', 'twitter', 250, facd7900-55cb-4fc5-844a-555c354cfe02, dateof(now()));

select * from popularsources where period = 'month-2017-06' and periodtype = 'month' and pipelinekey = 'twitter' and topiconjunctionid = facd7900-55cb-4fc5-844a-555c354cfe02 and (mentionCount, periodstartdate, periodenddate) >= (1, '2017-06-01', '2017-06-01') and (mentionCount, periodstartdate, periodenddate) <= (100000, '2017-06-30', '2017-06-30') LIMIT 1;
