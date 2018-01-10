import geoViewport from 'geo-viewport';
import PropTypes from 'prop-types';
import turfExtent from 'turf-extent';
import React from 'react';
import { reactAppMapboxTileServerUrl } from '../../config';

const DEFAULT_ZOOM = 8;
const PIN_COLOR = '0000FF';
const PIN_SIZE = 'l';

export default class MapViewPort extends React.Component {
  render() {
    const geoJsonFeatures = this.props.coordinates.map(coordinatePair => Object.assign({}, {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "Point",
          "coordinates": coordinatePair
        }
      }
    ));

    const geoJson = Object.assign({}, {"type": "FeatureCollection", "features": geoJsonFeatures});
    const bounds = turfExtent(geoJson);
    const vp = geoViewport.viewport(bounds, this.props.mapSize);
    const pins = this.props.coordinates.map(coordinatePair => `pin-${PIN_SIZE}-cross+${PIN_COLOR}(${coordinatePair.join(",")})`);
    const mapImageSrc = `${reactAppMapboxTileServerUrl}/${pins.join(',')}/${vp.center.join(',')},${pins.length > 1 ? vp.zoom : DEFAULT_ZOOM}@2x/${this.props.mapSize.join('x')}.png?access_token=${this.props.accessToken}`;

    return (
      <img src={mapImageSrc} alt="" width="100%"/>
    );
  }
}

MapViewPort.propTypes = {
  coordinates: PropTypes.array.isRequired,
  mapSize: PropTypes.array.isRequired
}
