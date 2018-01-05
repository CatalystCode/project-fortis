import React from 'react';
import { TileLayer as LeafletTileLayer } from 'react-leaflet';
import constants from '../../../actions/constants';

export class TileLayer extends React.Component {
    render() {
        return (
            <LeafletTileLayer
                {...this.props}
                attribution='Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>'
                url={constants.MAP.TILE_LAYER_URL}
                accessToken={constants.MAP.MAPBOX_ACCESS_TOKEN} />
        );
    }
}
