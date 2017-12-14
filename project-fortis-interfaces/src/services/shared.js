import request from 'request';
import { reactAppServiceHost } from '../config';

function fetchGqlData(endpoint, gqlQueryBody, callback) {
    const { query, variables } = gqlQueryBody;

    const POST = {
        url: `${reactAppServiceHost}/api/${endpoint}`,
        method: "POST",
        json: true,
        withCredentials: false,
        body: { query, variables }
    };

    request(POST, callback);
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
    fetchGqlData
};