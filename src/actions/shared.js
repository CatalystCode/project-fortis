import constants from './constants'

function DataSourceLookup (requestedSource) {
    // eslint-disable-next-line
    for (let [source, value] of constants.DATA_SOURCES.entries()) {
        if(value.sourceValues.indexOf(requestedSource) > -1){
            return value;
        }
    }

    return undefined;
}

function ResponseHandler (error, response, body, callback) {
    if(!error && response.statusCode === 200 && body.data && !body.errors) {
        callback(undefined, body.data);
    }else{
        const errMsg = `[${error}] occured while processing graphql request`;
        callback(errMsg, undefined);
    }
}

const DataSources = source => constants.DATA_SOURCES.has(source) ? constants.DATA_SOURCES.get(source).sourceValues : undefined;

module.exports = {
    DataSourceLookup,
    ResponseHandler,
    DataSources
};