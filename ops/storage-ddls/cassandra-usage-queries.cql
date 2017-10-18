insert into topicconjunctions (topic, computedfeatures, externalsourceid, periodstartdate, periodenddate, period, periodtype, pipelinekey) values ('isis', {mentions: 300}, 'all', '2017-06-01', '2017-06-30', 'month-2017-06', 'month', 'all');
alter table topicconjunctions add(conj_topic_car features, conj_topic_bomb features);
insert into topicconjunctions (topic, computedfeatures, conj_topic_car, conj_topic_bomb) values ('isis', {mentions: 350}, {mentions: 25}, {mentions: 25});
insert into topicconjunctions (topic, computedfeatures, externalsourceid, periodstartdate, periodenddate, period, periodtype, pipelinekey, conj_topic_car, conj_topic_bomb) values ('isis', {mentions: 350}, 'all', '2017-06-01', '2017-06-30', 'month-2017-06', 'month', 'all', {mentions: 25}, {mentions: 25});

insert into streams (streamid, pipelinekey, pipelinelabel, streamfactory, params) values (uuid(), 'instagram', 'Instagram', 'InstagramTag', {'connName':'Test'});
insert into streams (streamid, pipelinekey, pipelinelabel, streamfactory, params) values (uuid(), 'instagram', 'Instagram', 'InstagramLocation', {'connName':'Test'});

select * from streams where pipelinekey = 'instagram';

insert into trustedsources (externalsourceid, sourcetype, pipelinekey, rank, insertion_time) values ('@bloomberg', 'profile', 'twitter', 1, dateof(now()));
insert into trustedsources (externalsourceid, sourcetype, pipelinekey, rank, insertion_time) values ('kevhartman', 'profile', ' ', 1, dateof(now()));
select * from trustedsources where pipelinekey = 'twitter' ;

insert into computedtiles (tileid, tilex, tiley, tilez, periodstartdate, periodenddate, periodtype, period, pipeline, sourceid, topicconjunctionid) VALUES ('100_105_16', 100, 106, 16, '2017-06-01', '2017-06-30', 'month', 'month-2017-06', 'all', 'all', facd7900-55cb-4fc5-844a-555c354cfe02);

 select * from computedtiles where period = 'month-2017-06' and periodtype = 'month' and topicconjunctionid = facd7900-55cb-4fc5-844a-555c354cfe02 and pipeline = 'all' and tilez = 16 and sourceid='all' and (tilex, tiley, periodstartdate, periodenddate) >= (100, 105, '2017-06-01', '2017-06-01') and (tilex, tiley, periodstartdate, periodenddate) <= (100, 302, '2017-06-30', '2017-06-30');

insert into topicconjunctions(topic, topicconjunctionid, conjunctivekeywordcombination) values ('isis', uuid(), {'bomb': 123, 'terror': 100, 'car': 834});

select * from topicconjunctions where topic = 'isis';

insert into populartopics (topic, periodstartdate, periodenddate, periodtype, period, pipelinekey, externalsourceid, mentioncount, insertion_time, tilez, tilex, tiley) values ('elections', '2017-06-01', '2017-06-30', 'month', 'month-2017-06', 'all', 'all', 400, dateof(now()), 8, 141, 43);

insert into populartopics (topic, periodstartdate, periodenddate, periodtype, period, pipelinekey, externalsourceid, mentioncount, insertion_time, tilez, tilex, tiley) values ('elections', '2017-06-01', '2017-06-30', 'month', 'month-2017-06', 'all', 'all', 600, dateof(now()), 8, 142, 43);

select periodtype, pipelinekey, externalsourceid, tilez, topic, period, sum(mentioncount) as mentions from populartopics where periodtype = 'month' and tilez = 8 and pipelinekey = 'all' and period IN('month-2017-06') and externalsourceid = 'all' and (tilex, tiley, periodstartdate, periodenddate) >= (140, 41, '2017-06-01', '2017-06-01') and (tilex, tiley, periodstartdate, periodenddate) <= (143, 44, '2017-06-30', '2017-06-30') group by periodtype, pipelinekey, externalsourceid, tilez, topic, period allow filtering;

insert into computedtiles (periodstartdate, periodenddate, period, periodtype, externalsourceid, pipelinekey, conjunctiontopics, mentioncount, insertion_time, tilez, tilex, tiley) values ('2017-06-01', '2017-06-30', 'month-2017-06', 'month', '@bloomberg', 'twitter', ('isis', 'car'), 250, dateof(now()), 8, 141, 43);

insert into computedtiles (periodstartdate, periodenddate, period, periodtype, externalsourceid, pipelinekey, conjunctiontopics, mentioncount, insertion_time, tilez, tilex, tiley) values ('2017-06-01', '2017-06-30', 'month-2017-06', 'month', '@cnn', 'twitter', ('isis', 'car'), 2501, dateof(now()), 8, 141, 41);

insert into computedtiles (periodstartdate, periodenddate, period, periodtype, externalsourceid, pipelinekey, conjunctiontopics, mentioncount, insertion_time, tilez, tilex, tiley) values ('2017-06-01', '2017-06-30', 'month-2017-06', 'month', '@cnn', 'twitter', ('isis', 'car'), 2501, dateof(now()), 8, 141, 42);

insert into computedtiles (periodstartdate, periodenddate, period, periodtype, externalsourceid, pipelinekey, conjunctiontopics, mentioncount, insertion_time, tilez, tilex, tiley) values ('2017-06-01', '2017-06-30', 'month-2017-06', 'month', '@cnn', 'twitter', ('isis', 'car'), 50, dateof(now()), 8, 142, 43);

insert into computedtiles (periodstartdate, periodenddate, period, periodtype, externalsourceid, pipelinekey, conjunctiontopics, mentioncount, insertion_time, tilez, tilex, tiley) values ('2017-06-01', '2017-06-30', 'month-2017-06', 'month', '@cnn', 'twitter', ('isis', 'car'), 501, dateof(now()), 8, 140, 43);

insert into computedtiles (periodstartdate, periodenddate, period, periodtype, externalsourceid, pipelinekey, conjunctiontopics, mentioncount, insertion_time, tilez, tilex, tiley) values ('2017-06-01', '2017-06-30', 'month-2017-06', 'month', '@cnn', 'twitter', ('isis', 'car'), 250, dateof(now()), 8, 143, 43);

insert into computedtiles (periodstartdate, periodenddate, period, periodtype, externalsourceid, pipelinekey, mentioncount, conjunctiontopics, insertion_time, tilez, tilex, tiley) values ('2017-06-01', '2017-06-30', 'month-2017-06', 'month', '@bloomberg', 'twitter', 150, ('clinton'), dateof(now()), 8, 141, 43);

insert into computedtiles (periodstartdate, periodenddate, period, periodtype, externalsourceid, pipelinekey, mentioncount, conjunctiontopics, insertion_time, tilez, tilex, tiley) values ('2017-06-01', '2017-06-30', 'month-2017-06', 'month', '@reuters', 'twitter', 150, ('isis', 'car'), dateof(now()), 8, 141, 43);

insert into computedtiles (periodstartdate, periodenddate, period, periodtype, externalsourceid, pipelinekey, mentioncount, conjunctiontopics, insertion_time, tilez, tilex, tiley) values ('2017-06-01', '2017-06-30', 'month-2017-06', 'month', '@reuters', 'twitter', 150, ('isis', 'car'), dateof(now()), 8, 141, 42);

select periodtype, conjunctiontopics, tilez, externalsourceid, period, max(pipelinekey), sum(mentioncount) as mentions from popularsources where conjunctiontopics = ('isis', 'car') and periodtype = 'month' and tilez = 8 and pipelinekey = 'twitter' and period IN('month-2017-06') and (tilex, tiley, periodstartdate, periodenddate) >= (140, 41, '2017-06-01', '2017-06-01') and (tilex, tiley, periodstartdate, periodenddate) <= (143, 44, '2017-06-30', '2017-06-30') group by periodtype, conjunctiontopics, tilez, externalsourceid, period allow filtering;

insert into popularplaces (periodstartdate, periodenddate, period, periodtype, externalsourceid, pipelinekey, mentioncount, conjunctiontopics, insertion_time, placeid, placecentroidcoordx, placecentroidcoordy, placename) values ('2017-06-01', '2017-06-30', 'month-2017-06', 'month', 'all', 'all', 100, ('isis', 'car'), dateof(now()), '482804', 25.11222, -32.2333, 'London');

insert into popularplaces (periodstartdate, periodenddate, period, periodtype, externalsourceid, pipelinekey, mentioncount, conjunctiontopics, insertion_time, placeid, placecentroidcoordx, placecentroidcoordy, placename) values ('2017-06-01', '2017-06-30', 'month-2017-06', 'month', 'all', 'all', 220, ('isis', 'car'), dateof(now()), '482808', 22.11222, -32.2333, 'Paris');

select period, periodtype, pipelinekey, externalsourceid, conjunctiontopics, mentioncount, placename from popularplaces where conjunctiontopics = ('isis', 'car') and periodtype = 'month' and externalsourceid = 'all' and pipelinekey = 'all' and period IN('month-2017-06') and (mentioncount, periodstartdate, periodenddate, placecentroidcoordx, placecentroidcoordy) >= (1, '2017-06-01', '2017-06-01', 22, -33) and (mentioncount, periodstartdate, periodenddate, placecentroidcoordx, placecentroidcoordy) <= (100000000, '2017-06-30', '2017-06-30', 26, 0) LIMIT 1;

insert into eventtags(eventid, topic, placeid, placecentroidcoordx, placecentroidcoordy, eventtime, pipelinekey, externalsourceid) values (uuid(), 'isis', '455633', 12.43434, -45.3434, '2017-06-30', 'twitter', 'cnn');

insert into eventtags(eventid, topic, placeid, placecentroidcoordx, placecentroidcoordy, eventtime, pipelinekey, externalsourceid) values (ac01cb69-1684-4b5e-9016-7a4f0dcde074, 'car', '455633', 12.43434, -45.3434, '2017-06-30', 'twitter', 'cnn');

select eventid, pipelinekey, eventtime from eventtags where topic IN('isis', 'car') and pipelinekey IN('twitter', 'facebook') and (eventtime, placecentroidcoordx, placecentroidcoordy) >= ('2017-06-01', 12, -46) and (eventtime, placecentroidcoordx, placecentroidcoordy) <= ('2017-07-15', 12, -44);

select * from events where eventid IN(609a367a-c536-46a9-aee0-415625e8ff43, 7c0933b9-f6d1-417a-a7b2-fb738aad441c) and pipelinekey IN('twitter');

insert into conjunctivetopics (topic, conjunctivetopic, mentions) values ('isis', 'car', 45);
insert into conjunctivetopics (topic, conjunctivetopic, mentions) values ('isis', 'bomb', 345);
insert into conjunctivetopics (topic, conjunctivetopic, mentions) values ('isis', 'terror', 35);

select * from conjunctivetopics where topic = 'isis';


insert into computedtrends (topic, pipelinekey, periodstartdate, periodtype, period, tilez, tilex, tiley, score, insertion_time) values ('isis', 'twitter', '2017-06-20 00:00:00.00', 'day', '2017-06-20', 1, 2, 3, 1.234, toTimestamp(now()));
select * from computedtrends where pipelinekey = 'twitter' and periodtype = 'day' and tilez = 1 and period = '2017-06-20';
select * from computedtrends where pipelinekey = 'twitter' and periodtype = 'day' and period = '2017-06-20' and tilez = 1 and (tilex, tiley) >= (0, 0) and (tilex, tiley) < (10, 10);

