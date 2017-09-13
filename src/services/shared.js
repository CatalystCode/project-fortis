import request from 'request';

function fetchGqlData(endpoint, gqlQueryBody, callback) {
    const host = process.env.REACT_APP_SERVICE_HOST;
    const { query, variables } = gqlQueryBody;

    const POST = {
        url: `${host}/api/${endpoint}`,
        method: "POST",
        json: true,
        withCredentials: false,
        body: { query, variables }
    };

    request(POST, callback);
}

module.exports = {
    fetchGqlData
};