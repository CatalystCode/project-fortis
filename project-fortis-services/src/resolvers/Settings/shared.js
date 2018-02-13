const PlaceholderForSecret = 'secretHidden';

const SecretStreamParams = new Set([
  'consumerKey',
  'consumerSecret',
  'accessToken',
  'accessTokenSecret',
]);

function isSecretUnchanged(value) {
  return value === PlaceholderForSecret;
}

function hideSecret(obj, key) {
  if (obj[key]) {
    obj[key] = PlaceholderForSecret;
  }
}

function isSecretParam(param) {
  return SecretStreamParams.has(param);
}

function paramsToParamsEntries(params) {
  return Object.keys(params).map(key => ({ key, value: params[key] }));
}

function cassandraRowToStream(row) {
  if (row.enabled == null) {
    row.enabled = false;
  }

  let params;
  try {
    params = row.params_json ? JSON.parse(row.params_json) : {};
  } catch (err) {
    console.error(`Unable to parse params '${row.params_json}' for stream ${row.streamid}`);
    params = {};
  }

  return {
    streamId: row.streamid,
    pipelineKey: row.pipelinekey,
    pipelineLabel: row.pipelinelabel,
    pipelineIcon: row.pipelineicon,
    streamFactory: row.streamfactory,
    params: paramsToParamsEntries(params),
    enabled: row.enabled
  };
}

module.exports = {
  isSecretUnchanged,
  isSecretParam,
  hideSecret,
  cassandraRowToStream
};
