import request from 'request';
import { reactAppServiceHost } from '../config';

const auth = {
    user: null,
    token: null
};

function fetchGqlData(endpoint, { query, variables }, callback) {
    // todo: pass the credentials to the backend
    const { user, token } = auth;
    console.log('--------------------------');
    console.log('Got user:');
    console.log(user);
    console.log('Got token:')
    console.log(token);
    console.log('--------------------------');
    request({
        url: `${reactAppServiceHost}/api/${endpoint}`,
        method: 'POST',
        json: true,
        withCredentials: false,
        body: { query, variables }
    }, callback);
}

const MESSAGES_ENDPOINT = 'messages';
const TILES_ENDPOINT = 'tiles';
const EDGES_ENDPOINT = 'edges';
const SETTINGS_ENDPOINT = 'settings';

module.exports = {
    MESSAGES_ENDPOINT,
    TILES_ENDPOINT,
    EDGES_ENDPOINT,
    SETTINGS_ENDPOINT,
    auth,
    fetchGqlData
};