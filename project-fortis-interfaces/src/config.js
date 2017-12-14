module.exports = {
    publicUrl: process.env.PUBLIC_URL,
    reactAppAdClientId: process.env.REACT_APP_AD_CLIENT_ID,
    reactAppAdAuthority: process.env.REACT_APP_AD_AUTHORITY,
    reactAppAdGraphScopes: JSON.parse(process.env.REACT_APP_AD_GRAPH_SCOPES || `["${process.env.REACT_APP_AD_AUTHORITY}"]`),
    reactAppServiceHost: process.env.REACT_APP_SERVICE_HOST,
    reactAppFeatureServiceHost: process.env.REACT_APP_FEATURE_SERVICE_HOST
};
