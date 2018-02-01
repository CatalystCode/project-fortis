const reactAppMapboxTileLayerUrl = process.env.REACT_APP_MAPBOX_TILE_LAYER_URL || 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/256/{z}/{x}/{y}';

const reactAppMapboxTileServerUrl = process.env.REACT_APP_MAPBOX_TILE_SERVER_URL || 'https://api.mapbox.com/v4/mapbox.streets';

const reactAppAdTokenStoreKey = process.env.REACT_APP_AD_TOKEN_STORE_KEY || 'Fortis.AD.Token';

const reactAppAdClientId = process.env.REACT_APP_AD_CLIENT_ID || '';

const reactAppServiceHost = process.env.REACT_APP_SERVICE_HOST;
if (!reactAppServiceHost) console.error('Service host is not defined!');

module.exports = {
    reactAppMapboxTileLayerUrl,
    reactAppMapboxTileServerUrl,
    reactAppAdClientId,
    reactAppAdTokenStoreKey,
    reactAppServiceHost
};
