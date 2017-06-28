'use strict';

module.exports = {

  /** Create a prepared statement object
   * 
   * Preparing queries gets the best performance and will ensure that
   * the JavaScript parameters are correctly mapped to Cassandra types.
   * 
   * query: contains the topic insert statement
   * params: contains the params to be binded to the insert statement
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
        topic.insertion_time
      ]
    };
  }

};