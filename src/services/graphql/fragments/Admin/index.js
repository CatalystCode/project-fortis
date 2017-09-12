export const siteSettingsFragment = `fragment FortisSiteDefinitionView on SiteCollection {
  site {
    name
    properties {
        targetBbox
        defaultZoomLevel
        logo
        title
        fbToken
        mapzenApiKey
        defaultLocation
        defaultLanguage
        storageConnectionString
        featuresConnectionString
        supportedLanguages
    }
  }
}`;
