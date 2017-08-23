export const siteSettingsFragment = `fragment FortisSiteDefinitionView on SiteCollection {
        sites {
            name
            properties {
                targetBbox
                defaultZoomLevel
                logo
                title
                fbToken
                mapzenApiKey
                defaultLocation
                storageConnectionString
                featuresConnectionString
                supportedLanguages
            }
        }
    }`;
