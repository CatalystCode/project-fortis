const reactAppMapboxTileLayerUrl = process.env.REACT_APP_MAPBOX_TILE_LAYER_URL;
const reactAppAdClientId = process.env.REACT_APP_AD_CLIENT_ID;
const reactAppAdTokenStoreKey = process.env.REACT_APP_AD_TOKEN_STORE_KEY || 'Fortis.AD.Token';
const reactAppServiceHost = process.env.REACT_APP_SERVICE_HOST;
const reactAppFeatureServiceHost = process.env.REACT_APP_FEATURE_SERVICE_HOST;

module.exports = {
    reactAppMapboxTileLayerUrl,
    reactAppAdClientId,
    reactAppAdTokenStoreKey,
    reactAppServiceHost,
    reactAppFeatureServiceHost
};
