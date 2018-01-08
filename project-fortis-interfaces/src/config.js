const reactAppMapboxTileLayerUrl = process.env.REACT_APP_MAPBOX_TILE_LAYER_URL || 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/256/{z}/{x}/{y}';

const reactAppAdTokenStoreKey = process.env.REACT_APP_AD_TOKEN_STORE_KEY || 'Fortis.AD.Token';

const reactAppAdClientId = process.env.REACT_APP_AD_CLIENT_ID || '';

const reactAppServiceHost = process.env.REACT_APP_SERVICE_HOST;
if (!reactAppServiceHost) console.error('Service host is not defined!');

const reactAppFeatureServiceHost = process.env.REACT_APP_FEATURE_SERVICE_HOST;
if (!reactAppFeatureServiceHost) console.error('Feature service host is not defined!');

module.exports = {
    reactAppMapboxTileLayerUrl,
    reactAppAdClientId,
    reactAppAdTokenStoreKey,
    reactAppServiceHost,
    reactAppFeatureServiceHost
};
