export const getAdminSite = `sites {
        ...FortisSiteDefinitionView
}`;

export const getAdminSiteDefinition = `query sites {
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

export const getPipelineTerms = `siteTerms(translationLanguage:$translationLanguage){
  edges {
    name
    translatedname
  }
}`;

export const getPipelineDenfintion = `query PipelineDefintion($translationLanguage: String) {
    terms: ${getPipelineTerms}
    configuration: ${getAdminSite}
}`;

export const getPipelineWatchlist = `query PipelineDefintion($translationLanguage: String!) {
  terms: ${getPipelineTerms}
}`;