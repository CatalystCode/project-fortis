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
        mapSvcToken
        fbToken
        defaultLocation
        defaultLanguage
        storageConnectionString
        featuresConnectionString
        supportedLanguages
    }
  }
}`;

export const getPipelineTerms = `siteTerms(translationLanguage:$translationLanguage, category: $category){
  edges {
    name
    translatedname
  }
}`;

export const getPipelineStreams = `streams {
  streams {
    pipelineKey
    pipelineIcon
    pipelineLabel
    enabled
  }
}`;

export const getPipelineWatchlist = `query PipelineDefintion($translationLanguage: String!, $category: String) {
   terms: ${getPipelineTerms}
}`;

export const getPipelineDefinition = `query PipelineDefintion($translationLanguage: String, $category: String) {
    terms: ${getPipelineTerms}
    streams: ${getPipelineStreams}
    configuration: ${getAdminSite}
}`;

export const getSite = `query Sites {
  sites {
		...SiteView
  }
}`;

export const getTopics = `query SiteTerms($translationLanguage: String, $category: String) {
  siteTerms(translationLanguage: $translationLanguage, category: $category) {
    ...TopicsView
  }
}`;

export const getTrustedSources = `query TrustedSources {
  trustedSources {
    ...TrustedSourcesView
  }
}`;

export const getBlacklists = `query Blacklist {
  termBlacklist {
    ...BlacklistView
  }
}`;

export const getStreams = `query Streams {
  streams {
    ...StreamsView
  }
}`;