'use strict';

const xml2js = require('xml2js');
const Promise = require('promise');
const request = require('request');
const { trackEvent, trackException } = require('../appinsights/AppInsightsClient');
const deprecated = require('./deprecated');
const loggingClient = require('../appinsights/LoggingClient');

const {
  translationServiceTokenHost, translationServiceTranslatorHost
} = require('../../../config').translator;

const translatorUri = `${translationServiceTranslatorHost}/V2/Http.svc/Translate`;
const translatorArrayUri = `${translationServiceTranslatorHost}/V2/Http.svc/TranslateArray`;
const tokenRefetchSeconds = (10 - 2) * 60; // 10 minutes validity minus 2 minutes to always avoid expiry

function getAccessTokenForTranslation(token) {
  if (!token && deprecated.client_id && deprecated.client_secret) {
    return deprecated.getAccessTokenForTranslation();
  }

  const POST = {
    url: `${translationServiceTokenHost}/sts/v1.0/issueToken`,
    data: '',
    headers: {
      'Ocp-Apim-Subscription-Key': token
    }
  };

  return new Promise((resolve, reject) => {
    const now = new Date();

    request.post(POST, (err, response, body) => {
      if (response.statusCode !== 200 || err) {
        try {
          err = JSON.parse(body);
        } catch (exception) {
          trackException(err);
          return reject(err);
        }
        trackException(err);
        return reject(err);
      } else {
        resolve({
          'token': body,
          'expires': new Date(now.getTime() + tokenRefetchSeconds * 1000)
        });
      }
    });
  });
}

function TranslateSentenceArrayWithToken(access_token, wordsToTranslate, fromLanguage, toLanguage) {
  const headers = {
    'Authorization': 'Bearer ' + access_token,
    'Content-Type': 'text/xml; charset=utf-8'
  };

  const text = `<Texts>${wordsToTranslate.map(text => `<string xmlns='http://schemas.microsoft.com/2003/10/Serialization/Arrays'>${text}</string>`).join('')}</Texts>`;
  const requestXML = `<TranslateArrayRequest><AppId/><From>${fromLanguage}</From>${text}<To>${toLanguage}</To></TranslateArrayRequest>`;

  const POST = {
    url: translatorArrayUri,
    headers: headers,
    body: requestXML
  };
  return new Promise((resolve, reject) => {
    request.post(POST, (err, response, body) => {
      if (err || !response || response.statusCode !== 200) {
        trackException(err);
        return reject(err || 'Failed to pull data from: ' + JSON.stringify(response));
      } else {
        xml2js.parseString(body, (err, result) => {
          if (!err & !!result && result.ArrayOfTranslateArrayResponse && result.ArrayOfTranslateArrayResponse.TranslateArrayResponse) {
            const translatedPhrases = result.ArrayOfTranslateArrayResponse.TranslateArrayResponse;
            resolve(wordsToTranslate.map((phrase, index) => Object.assign({}, { originalSentence: phrase, translatedSentence: translatedPhrases[index].TranslatedText })));
          } else {
            trackException(err);
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
    url: translatorUri,
    headers: headers,
    qs: payload
  };
  return new Promise((resolve, reject) => {
    request(options, function (err, response, body) {
      if (err || !response || response.statusCode !== 200) {
        trackException(err);
        return reject(err || 'Failed to pull data from: ' + JSON.stringify(response));
      } else {
        xml2js.parseString(body, (err, result) => {
          if (!err & !!result && !!result['string'] && !!result['string']['_']) {
            resolve(result['string']['_']);
          } else {
            trackException(err);
            return reject(err || 'Failed to pull data from: ' + JSON.stringify(response));
          }
        });
      }
    });
  });
}

function translateSentenceArray(token, wordsToTranslate, fromLanguage, toLanguage) {
  return new Promise((resolve, reject) => {
    getAccessTokenForTranslation(token)
      .then(authBody => {
        TranslateSentenceArrayWithToken(authBody.token, wordsToTranslate, fromLanguage, toLanguage)
          .then(result => resolve({ translatedSentence: result }))
          .catch(error => {
            trackException(error);
            reject(error);
          });
      })
      .catch(error => {
        trackException(error);
        reject(error);
      });
  });
}

function translate(token, sentence, fromLanguage, toLanguage) {
  return new Promise((resolve, reject) => {
    getAccessTokenForTranslation(token)
      .then(authBody => {
        TranslateWithToken(authBody.token, sentence, fromLanguage, toLanguage)
          .then(result => resolve({ translatedSentence: result }))
          .catch(error => {
            trackException(error);
            reject(error);
          });
      })
      .catch(error => {
        trackException(error);
        reject(error);
      });
  });
}

module.exports = {
  translateSentenceArray: trackEvent(translateSentenceArray, 'MicrosoftTranslator', loggingClient.translateExtraProps(), loggingClient.translateWordsExtraMetrics()),
  translate: trackEvent(translate, 'MicrosoftTranslator', loggingClient.translateExtraProps(), loggingClient.translateExtraMetrics())
};