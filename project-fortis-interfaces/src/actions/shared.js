function ResponseHandler (error, response, body, callback) {
    if(!error && response.statusCode === 200 && body.data && !body.errors) {
        callback(undefined, body.data);
    }else{
        const errMsg = `[${error}] occured while processing graphql request`;
        callback(errMsg, undefined);
    }
}

const DataSources = (source, enabledStreams) => enabledStreams.has(source) ? enabledStreams.get(source).sourceValues : undefined;

module.exports = {
    ResponseHandler,
    DataSources
};