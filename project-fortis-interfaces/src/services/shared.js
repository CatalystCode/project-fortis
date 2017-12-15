import request from 'request';
import { reactAppServiceHost } from '../config';

const auth = { token: null }; // token will get set as soon as it's available

function fetchGqlData(endpoint, { query, variables }, callback) {
    request({
        url: `${reactAppServiceHost}/api/${endpoint}`,
        method: 'POST',
        json: true,
        withCredentials: false,
        headers: { 'Authorization': `Bearer ${auth.token}` },
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