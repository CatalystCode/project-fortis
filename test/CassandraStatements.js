const chai = require('chai');
const assert = chai.assert;
const moment = require('moment');
const cassandraStatements = require('../src/statements/CassandraStatements');

describe('Tests for CassandraStatements.js', function() {

  describe('#prepareInsertTopic(topic)', function() {

    it('should create the prepared mutation object for topic with a defined keyword and lang_code', function() {
      let topic = {
        keyword: 'hurricane',
        lang_code: 'en'
      };

      let result = cassandraStatements.prepareInsertTopic(topic);
      assert.equal(result.params[0], topic.keyword, 'the first param in params is the topic\'s keyword');
      assert.equal(result.params[1], topic.lang_code, 'the second param in params is the topic\'s lang_code');
      assert.equal(result.params[2], topic.translations, 'the third param in params is the topic\'s translations');
    });

    it('should create the prepared mutation object for topic with a defined keyword, lang_code, and translations', function() {
      let topic = {
        keyword: 'hurricane',
        lang_code: 'en',
        translations: {
          'fr':'ouragan',
          'it': 'uragano'
        }
      };

      let result = cassandraStatements.prepareInsertTopic(topic);
      assert.equal(result.params[0], topic.keyword, 'the first param in params is the topic\'s keyword');
      assert.equal(result.params[1], topic.lang_code, 'the second param in params is the topic\'s lang_code');
      assert.equal(result.params[2], topic.translations, 'the third param in params is the topic\'s translations');
    });

    it('should return null on a topic not containing both a defined keyword and lang_code', function() {
      let topic = {
        keyword: 'hurricane'
      };
      let result = cassandraStatements.prepareInsertTopic(topic);
      assert.equal(result, null, 'the result should equal null');
    });

  });
});