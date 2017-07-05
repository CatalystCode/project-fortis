'use strict';

const request = require('request');
const sinon = require('sinon');
const chai = require('chai');
const blobStorageClient = require('../src/clients/storage/BlobStorageClient');
chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

describe('Tests for BlobStorageClient.js', function() {

  describe('#getTopicsBySiteType(siteType)', function() {
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

    it('should return an array of topics', function() {
      let siteType = 'humanitarian';
      return blobStorageClient.getTopicsBySiteType(siteType).should.eventually.deep.equal(body);
    });
  });

});