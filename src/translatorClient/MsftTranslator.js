let xml2js = require('xml2js');
let nconf = require('nconf');
let Promise = require('promise');
let request = require('request');
let memoryStore = new nconf.Memory();

const client_id = process.env.TRANSLATION_SERVICE_CLIENT_ID;
const client_secret = process.env.TRANSLATION_SERVICE_CLIENT_SECRET;
const datamarket_auth_uri = 'https://datamarket.accesscontrol.windows.net/v2/OAuth2-13';
const translator_scope = 'http://api.microsofttranslator.com/';
const translator_uri = 'http://api.microsofttranslator.com/V2/Http.svc/Translate';
const translator_array_uri = 'http://api.microsofttranslator.com/V2/Http.svc/TranslateArray';

function TranslatorAccessTokenExpired() {
    let translatorToken = memoryStore.get('translatorToken');
    if (translatorToken && translatorToken.expires > Date.now()) {
        console.log('token missing/expired');
        return false;
    }else{
        return true;
    }
}

function getAccessTokenForTranslation() {
    const grant_type = 'client_credentials';
    const now = new Date();

    const payload = {
        client_id: client_id,
        client_secret: client_secret,
        scope: translator_scope,
        grant_type: grant_type
    };

    const POST = {
        url: datamarket_auth_uri,
        form: payload
    };

    return new Promise((resolve, reject) => {
        request.post(POST, (err, response, body) => {
            if (response.statusCode !== 200 || err) {
                reject(err);
            }
            else {
                body = JSON.parse(body);
                resolve({
                    'token': body.access_token,
                    'expires': new Date(now.getTime() + parseInt(body.expires_in - 1) * 1000)
                });
            }
        });
    });
}

function TranslateSentenceArray(access_token, wordsToTranslate, fromLanguage, toLanguage) {
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
                reject(err || 'Failed to pull data from: ' + JSON.stringify(response));
            }
            else {
                xml2js.parseString(body, (err, result) => {
                    if (!err & !!result && result.ArrayOfTranslateArrayResponse && result.ArrayOfTranslateArrayResponse.TranslateArrayResponse) {
                        const translatedPhrases = result.ArrayOfTranslateArrayResponse.TranslateArrayResponse;
                        resolve(wordsToTranslate.map((phrase, index)=>Object.assign({}, {originalSentence: phrase, translatedSentence: translatedPhrases[index].TranslatedText})));
                    } else {
                        reject(err || 'Failed to pull data from: ' + JSON.stringify(response));
                    }
                });
            }
        });
    });
}

function TranslateSentence(access_token, sentence, fromLanguage, toLanguage) {
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
                reject(err || 'Failed to pull data from: ' + JSON.stringify(response));
            }
            else {
                xml2js.parseString(body, (err, result) => {
                    if (!err & !!result && !!result['string'] && !!result['string']['_']) {
                        resolve(result['string']['_']);
                    } else {
                        reject(err || 'Failed to pull data from: ' + JSON.stringify(response));
                    }
                });
            }
        });
    });
}

module.exports = {
    translateSentenceArray: function(wordsToTranslate, fromLanguage, toLanguage) {
        return new Promise((resolve, reject) => {
            if (!TranslatorAccessTokenExpired()) {
                TranslateSentenceArray(memoryStore.get('translatorToken').token, wordsToTranslate, fromLanguage, toLanguage).then(
                    result => resolve({ translatedSentence: result }), error => reject(error));
            } else {
                getAccessTokenForTranslation().then(authBody => {
                    memoryStore.set('translatorToken', authBody);
                    TranslateSentenceArray(authBody.token, wordsToTranslate, fromLanguage, toLanguage).then(
                        result => resolve({ translatedSentence: result }), error => reject(error));
                }, error => reject(error));
            }
        });
    },
    translate: function(sentence, fromLanguage, toLanguage) {
        return new Promise((resolve, reject) => {
            if (!TranslatorAccessTokenExpired()) {
                TranslateSentence(memoryStore.get('translatorToken').token, sentence, fromLanguage, toLanguage).then(
                    result => resolve({ translatedSentence: result }), error => reject(error));
            } else {
                getAccessTokenForTranslation().then(authBody => {
                    memoryStore.set('translatorToken', authBody);
                    TranslateSentence(authBody.token, sentence, fromLanguage, toLanguage).then(
                        result => resolve({ translatedSentence: result }), error => reject(error));
                }, error => reject(error));
            }
        });
    }
};