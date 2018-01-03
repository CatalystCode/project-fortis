import geoViewport from 'geo-viewport';
import PropTypes from 'prop-types';
import turfExtent from 'turf-extent';
import React from 'react';

const tileStyle = "mapbox.streets";
const DEFAULT_ZOOM = 8;
const tileServer = "https://api.mapbox.com/v4";
const accessToken = "pk.eyJ1IjoiZXJpa3NjaGxlZ2VsIiwiYSI6ImNpaHAyeTZpNjAxYzd0c200dWp4NHA2d3AifQ.5bnQcI_rqBNH0rBO0pT2yg";

class MapViewPort extends React.Component {
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

        const color = '0000FF';
        const pinsize = 'l';
        const geoJson = Object.assign({}, {"type": "FeatureCollection", "features": geoJsonFeatures});
        const bounds = turfExtent(geoJson);
        const vp = geoViewport.viewport(bounds, this.props.mapSize);
        const pins = this.props.coordinates.map(coordinatePair => `pin-${pinsize}-cross+${color}(${coordinatePair.join(",")})`);
        const mapImageSrc = `${tileServer}/${tileStyle}/${pins.join(',')}/${vp.center.join(',')},${pins.length > 1 ? vp.zoom : DEFAULT_ZOOM}@2x/${this.props.mapSize.join('x')}.png?access_token=${accessToken}`;

        return (
            <img src={mapImageSrc} alt="" width="100%"/>
        );
    }
}

MapViewPort.propTypes = {
    coordinates: PropTypes.array.isRequired,
    mapSize: PropTypes.array.isRequired
}

export default MapViewPort;