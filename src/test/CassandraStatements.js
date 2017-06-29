'use strict';
let assert = require('assert');
let sinon = require('sinon'); 
let cassandraStatements = require('../src/statements/CassandraStatements');

describe('Tests for CassandraStatements.js', function() {
  describe('#prepareInsertTopic(topic)', function() {
    it('should pass topic with correct values to insert', function() {
      let spy = sinon.spy(cassandraStatements, 'prepareInsertTopic');
      let obj = {};
      assert(spy.alwaysCalledOn(obj));
    });
  });
});