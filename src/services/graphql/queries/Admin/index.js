export const getAdminSite = `sites {
        ...FortisSiteDefinitionView
}`;

export const getAdminSiteDefinition = `query SiteDefintion($siteId: String, $selectedLanguage: String) {
    siteDefinition: ${getAdminSite}
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