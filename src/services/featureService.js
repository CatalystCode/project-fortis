import request from 'request';

const HOST = process.env.REACT_APP_FEATURE_SERVICE_HOST;

function fetchLocationsFromFeatureService(bbox, matchName, namespace, callback) {
  if (!matchName || !bbox || bbox.length !== 4) {
    return callback(null, []);
  }

  const url = `${HOST}/features/bbox/${bbox.join('/')}?include=bbox,centroid&filter_namespace=${namespace}&filter_name=${matchName}`;

  request({ url, json: true }, (err, response) =>
    callback(err, (response && response.body && response.body.features) || []));
}

export {
  fetchLocationsFromFeatureService,
};