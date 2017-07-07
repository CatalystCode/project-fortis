'use strict';

const xml2js = require('xml2js');
const nconf = require('nconf');
const Promise = require('promise');
const request = require('request');
const trackDependency = require('../appinsights/AppInsightsClient').trackDependency;
const deprecated = require('./deprecated');

const ACCOUNT_KEY = process.env.TRANSLATION_SERVICE_ACCOUNT_KEY;
const TOKEN_URL_BASE = process.env.TRANSLATION_SERVICE_TOKEN_HOST || 'https://api.cognitive.microsoft.com';
const TRANSLATOR_URL_BASE = process.env.TRANSLATION_SERVICE_TRANSLATOR_HOST || 'https://api.microsofttranslator.com';
const TOKEN_REFETCH_SECONDS = (10 - 2) * 60; // 10 minutes validity minus 2 minutes to always avoid expiry

const translator_uri = `${TRANSLATOR_URL_BASE}/V2/Http.svc/Translate`;
const translator_array_uri = `${TRANSLATOR_URL_BASE}/V2/Http.svc/TranslateArray`;
const memoryStore = new nconf.Memory();

function TranslatorAccessTokenExpired() {
  let translatorToken = memoryStore.get('translatorToken');
  if (translatorToken && translatorToken.expires > Date.now()) {
    console.log('token missing/expired');
    return false;
  } else {
    return true;
  }
}

function getAccessTokenForTranslation() {
  if (!ACCOUNT_KEY && deprecated.client_id && deprecated.client_secret) {
    return deprecated.getAccessTokenForTranslation();
  }

  const POST = {
    url: `${TOKEN_URL_BASE}/sts/v1.0/issueToken`,
    data: '',
    headers: {
      'Ocp-Apim-Subscription-Key': ACCOUNT_KEY
    }
  };

  return new Promise((resolve, reject) => {
    const now = new Date();

    request.post(POST, (err, response, body) => {
      if (response.statusCode !== 200 || err) {
        return reject(err);
      } else {
        resolve({
          'token': body,
          'expires': new Date(now.getTime() + TOKEN_REFETCH_SECONDS * 1000)
        });
      }
    });
  });
}

function TranslateSentenceArrayWithToken(access_token, wordsToTranslate, fromLanguage, toLanguage) {
  const headers = {
    'Authorization': 'Bearer ' + access_token,
    'Content-Type':'text/xml; charset=utf-8'
  };

  const text = `<Texts>${wordsToTranslate.map(text=>`<string xmlns='http://schemas.microsoft.com/2003/10/Serialization/Arrays'>${text}</string>`).join('')}</Texts>`;
  const requestXML = `<TranslateArrayRequest><AppId/><From>${fromLanguage}</From>${text}<To>${toLanguage}</To></TranslateArrayRequest>`;

  const POST = {
    url: translator_array_uri,
    headers: headers,
    body: requestXML
  };
  return new Promise((resolve, reject) => {
    request.post(POST, (err, response, body) => {
      if (err || !response || response.statusCode !== 200) {
        return reject(err || 'Failed to pull data from: ' + JSON.stringify(response));
      } else {
        xml2js.parseString(body, (err, result) => {
          if (!err & !!result && result.ArrayOfTranslateArrayResponse && result.ArrayOfTranslateArrayResponse.TranslateArrayResponse) {
            const translatedPhrases = result.ArrayOfTranslateArrayResponse.TranslateArrayResponse;
            resolve(wordsToTranslate.map((phrase, index)=>Object.assign({}, {originalSentence: phrase, translatedSentence: translatedPhrases[index].TranslatedText})));
          } else {
            return reject(err || 'Failed to pull data from: ' + JSON.stringify(response));
          }
        });
      }
    });
  });
}

function TranslateWithToken(access_token, sentence, fromLanguage, toLanguage) {
  var payload = { text: sentence, to: toLanguage, from: fromLanguage };
  var headers = { Authorization: 'Bearer ' + access_token };

  var options = {
    url: translator_uri,
    headers: headers,
    qs: payload
  };
  return new Promise((resolve, reject) => {
    request(options, function (err, response, body) {
      if (err || !response || response.statusCode !== 200) {
        return reject(err || 'Failed to pull data from: ' + JSON.stringify(response));
      } else {
        xml2js.parseString(body, (err, result) => {
          if (!err & !!result && !!result['string'] && !!result['string']['_']) {
            resolve(result['string']['_']);
          } else {
            return reject(err || 'Failed to pull data from: ' + JSON.stringify(response));
          }
        });
      }
    });
  });
}

function translateSentenceArray(wordsToTranslate, fromLanguage, toLanguage) {
  return new Promise((resolve, reject) => {
    if (!TranslatorAccessTokenExpired()) {
      TranslateSentenceArrayWithToken(memoryStore.get('translatorToken').token, wordsToTranslate, fromLanguage, toLanguage)
      .then(result => resolve({ translatedSentence: result }))
      .catch(reject);
    } else {
      getAccessTokenForTranslation()
      .then(authBody => {
        memoryStore.set('translatorToken', authBody);
        TranslateSentenceArrayWithToken(authBody.token, wordsToTranslate, fromLanguage, toLanguage)
        .then(result => resolve({ translatedSentence: result }))
        .catch(reject);
      })
      .catch(reject);
    }
  });
}

function translate(sentence, fromLanguage, toLanguage) {
  return new Promise((resolve, reject) => {
    if (!TranslatorAccessTokenExpired()) {
      TranslateWithToken(memoryStore.get('translatorToken').token, sentence, fromLanguage, toLanguage)
      .then(result => resolve({ translatedSentence: result }))
      .catch(reject);
    } else {
      getAccessTokenForTranslation()
      .then(authBody => {
        memoryStore.set('translatorToken', authBody);
        TranslateWithToken(authBody.token, sentence, fromLanguage, toLanguage)
        .then(result => resolve({ translatedSentence: result }))
        .catch(reject);
      })
      .catch(reject);
    }
  });
}

module.exports = {
  translateSentenceArray: trackDependency(translateSentenceArray, 'MsftTranslator', 'translateSentenceArray'),
  translate: trackDependency(translate, 'MsftTranslator', 'translate')
};