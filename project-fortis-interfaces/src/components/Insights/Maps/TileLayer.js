import React from 'react';
import { TileLayer as LeafletTileLayer } from 'react-leaflet';
import { reactAppMapboxTileLayerUrl } from '../../../config';

export class TileLayer extends React.Component {
    render() {
        return (
            <LeafletTileLayer
                maxZoom={this.props.maxZoom}
                minZoom={this.props.minZoom}
                attribution='Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>'
                url={`${reactAppMapboxTileLayerUrl}?access_token=${this.props.accessToken}`}
                accessToken={this.props.accessToken} />
        );
    }
}
