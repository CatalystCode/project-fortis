function ResponseHandler (error, response, body, callback) {
    if (!error && response.statusCode === 200 && body.data && !body.errors) {
        callback(undefined, body.data);
    } else {
        const code = response ? response.statusCode : 500;
        const message = `GraphQL call failed: ${formatGraphQlErrorDetails(body, error)}`;
        callback({ code, message }, undefined);
    }
}

function formatGraphQlErrorDetails(body, error) {
    if (!body) {
        return error;
    }

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