let sinon = require('sinon');
const cassandra = require('cassandra-driver');
let cassandraTableStorageManager = require('../src/storageClients/CassandraTableStorageManager');

describe('Tests for CassandraTableStorageManager.js', function() {

  describe('#batchMutations(client, mutations, callback)', function() {

    it('should pass success into the callback if save fails', function() {

      const client = new cassandra.Client();
      let clientStub = this.stub(client, 'batch');
      let mutations = [{
        query: `INSERT INTO watchlist (
        keyword,
        lang_code,
        translations,
        insertion_time
      ) VALUES (?, ?, ?, ?)`,
        params: [
          'pollution',
          'en',
          null,
          '05/24/2017 01:45'
        ]
      }];
      let callback = sinon.spy();
      cassandraTableStorageManager.batchMutations(clientStub, mutations, callback);
      this.assert.calledWith(callback, 'success');

    });

    it('should pass the error into the callback if save fails', function() {
      const client = new cassandra.Client();
      let clientStub = this.stub(client, 'batch');
      let callback = this.spy();
      let mutations = '';
      cassandraTableStorageManager.batchMutations(clientStub, mutations, callback);
      this.assert.calledWith(callback, 'failed');
    });

  });
});