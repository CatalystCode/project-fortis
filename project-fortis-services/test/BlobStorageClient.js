'use strict';

const request = require('request');
const sinon = require('sinon');
const chai = require('chai');
const blobStorageClient = require('../src/clients/storage/BlobStorageClient');
chai.should();

const {
  fortisCentralAssetsHost
} = require('../config').storage;

describe('Tests for BlobStorageClient.js', function() {

  describe('#fetchTopicsBySiteType(siteType)', function() {
    let response = {statusCode: 200};
    let body = [
      {keyword: 'aid', lang_code: 'en'},
      {keyword: 'donate', lang_code: 'en'}
    ];

    before(function(){
      sinon
        .stub(request, 'get')
        .yields(null, response, JSON.stringify(body));
    });

    after(function(){
      request.get.restore();
    });

    it('should return a json array', function() {
      let siteType = 'humanitarian';
      let uri = `${fortisCentralAssetsHost}/settings/siteTypes/${siteType}/topics/defaultTopics.json`;
      return blobStorageClient.fetchJson(uri)
        .then(response => {
          response.should.deep.equal(body);
        })
        .catch(err => {
          Boolean(err).should.be.false;
        });
    });
  });

});