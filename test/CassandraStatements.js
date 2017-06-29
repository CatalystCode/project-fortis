let chai = require('chai');
let assert = chai.assert;
let moment = require('moment');
let cassandraStatements = require('../src/statements/CassandraStatements');
const DATE_FORMAT = 'MM/DD/YYYY HH:mm';

describe('Tests for CassandraStatements.js', function() {

  describe('#prepareInsertTopic(topic)', function() {

    it('should create the prepared mutation object correctly', function() {
      let topic = {
        keyword: 'hurricane',
        lang_code: 'en'
      };

      let result = cassandraStatements.prepareInsertTopic(topic);
      assert.equal(result.query, `INSERT INTO watchlist (
        keyword,
        lang_code,
        translations,
        insertion_time
      ) VALUES (?, ?, ?, ?)`, 'the prepared object\'s query is an INSERT statement');
      assert.equal(result.params[0], topic.keyword, 'the first param in params is the topic\'s keyword');
      assert.equal(result.params[1], topic.lang_code, 'the second param in params is the topic\'s lang_code');
      assert.equal(result.params[2], topic.translations, 'the third param in params is the topic\'s translations');
      assert.equal(result.params[3], moment(Date.now(), DATE_FORMAT, 'en').toISOString(), 'the fourth param in params is the topic\'s translations');
    });

    it('should return null on a malformed topic', function() {
      let topic = {
        keyword: 'hurricane'
      };
      let result = cassandraStatements.prepareInsertTopic(topic);
      assert.equal(result, null, 'the result should equal null');
    });

  });
});