'use strict';
let moment = require('moment');
const DATE_FORMAT = 'MM/DD/YYYY HH:mm';

module.exports = {

  /** Create an INSERT prepared statement object.
   * The prepared statement object has two properties, query and params.
   * query: contains the topic INSERT statement
   * params: contains the params to be binded to the INSERT statement
   * 
   * Preparing queries gets the best performance and will ensure that
   * the JavaScript parameters are correctly mapped to Cassandra types.
   */
  prepareInsertTopic: topic => {

    return {
      query: `INSERT INTO watchlist (
        keyword,
        lang_code,
        translations,
        insertion_time
      ) VALUES (?, ?, ?, ?)`,
      params: [ 
        topic.keyword, 
        topic.lang_code, 
        topic.translations,
        moment(Date.now(), DATE_FORMAT, 'en').toISOString()
      ]
    };
  }

};