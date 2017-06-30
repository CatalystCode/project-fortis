'use strict';

/** Create an INSERT prepared statement object.
 * 
 * Preparing queries gets the best performance and will ensure that
 * the JavaScript parameters are correctly mapped to Cassandra types.
 * 
 * http://docs.datastax.com/en/developer/nodejs-driver/3.2/features/batch/
 * This will be used for the batch() method, so the object needs to have
 * two properties: query and params
 * 
 * @param {{keyword: string, lang_code: string, ?translations: map<string,string>}}
 * @returns {{mutation: string, params: Array<string|map<string,string>>}}
 */
function prepareInsertTopic(topic) {
  if(!topic.keyword || !topic.lang_code) return null;
  else return {
    query: 'INSERT INTO watchlist (keyword,lang_code,translations,insertion_time) VALUES (?, ?, ?, dateof(now()))',
    params: [ 
      topic.keyword, 
      topic.lang_code, 
      topic.translations
    ]
  };
}

module.exports = {
  prepareInsertTopic: prepareInsertTopic
};