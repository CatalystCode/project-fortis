const Promise = require('promise');
const request = require('request');

const client_id = process.env.TRANSLATION_SERVICE_CLIENT_ID;
const client_secret = process.env.TRANSLATION_SERVICE_CLIENT_SECRET;

const datamarket_auth_uri = 'https://datamarket.accesscontrol.windows.net/v2/OAuth2-13';
const translator_scope = 'http://api.microsofttranslator.com/';
const grant_type = 'client_credentials';

function getAccessTokenForTranslation() {
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
        return reject(err);
      } else {
        body = JSON.parse(body);
        resolve({
          'token': body.access_token,
          'expires': new Date(now.getTime() + parseInt(body.expires_in - 1) * 1000)
        });
      }
    });
  });
}

module.exports = {
  client_id: client_id,
  client_secret: client_secret,
  getAccessTokenForTranslation: getAccessTokenForTranslation
};
