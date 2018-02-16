import request from 'request';
import { reactAppServiceHost } from '../config';
import { auth } from './shared';

export function fetchLocationsFromFeatureService(bbox, matchName, namespace, callback) {
  if (!matchName || !bbox || bbox.length !== 4) {
    return callback(null, []);
  }

  const url = `${reactAppServiceHost}/api/featureservice/features/bbox/${bbox.join('/')}?include=bbox,centroid&filter_namespace=${namespace}&filter_name=${matchName}`;

  request({
    url,
    headers: { 'Authorization': `Bearer ${auth.token}` },
    json: true
  }, (err, response) => callback(err, (response && response.body && response.body.features) || []));
}
