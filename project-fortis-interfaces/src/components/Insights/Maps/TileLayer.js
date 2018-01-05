import React from 'react';
import { TileLayer as LeafletTileLayer } from 'react-leaflet';
import { reactAppMapboxAccessToken, reactAppMapboxTileLayerUrl } from '../../../config';

export class TileLayer extends React.Component {
    render() {
        return (
            <LeafletTileLayer
                {...this.props}
                attribution='Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>'
                url={`${reactAppMapboxTileLayerUrl}?access_token=${reactAppMapboxAccessToken}`}
                accessToken={reactAppMapboxAccessToken} />
        );
    }
}
