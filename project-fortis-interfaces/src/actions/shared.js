function ResponseHandler (error, response, body, callback) {
    if (!error && response.statusCode === 200 && body.data && !body.errors) {
        callback(undefined, body.data);
    } else {
        callback({ code: response.statusCode, message: `GraphQL call failed: ${formatGraphQlErrorDetails(body)}` }, undefined);
    }
}

function formatGraphQlErrorDetails(body) {
    if (!body.errors) {
        return body;
    }

    const errors = Array.from(new Set(body.errors.map(error => error.message)));
    errors.sort();
    return errors.join("; ");
}

const DataSources = (source, enabledStreams) => enabledStreams.has(source) ? enabledStreams.get(source).sourceValues : undefined;

module.exports = {
    ResponseHandler,
    DataSources
};