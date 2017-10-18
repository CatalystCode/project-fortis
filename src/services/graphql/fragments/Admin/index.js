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
        featureservicenamespace
        storageConnectionString
        featuresConnectionString
        supportedLanguages
    }
  }
}`;

export const site = `fragment SiteView on SiteCollection {
  site {
    name
    properties {
      targetBbox
      defaultZoomLevel
      logo
      title
      defaultLocation
      defaultLanguage
      supportedLanguages
      featureservicenamespace
      translationSvcToken
      cogSpeechSvcToken
      cogVisionSvcToken
      cogTextSvcToken
    }
  }
}`;

export const topics = `fragment TopicsView on TermCollection {
  edges {
    topicid
    name
    translatedname
    namelang
    translatednamelang
    category
    translations {
      key
      value
    }
  }
}`;

export const blacklist = `fragment BlacklistView on BlacklistCollection {
  filters {
    id
    filteredTerms
  }
}`;

export const trustedsources = `fragment TrustedSourcesView on SourceCollection {
  sources {
    rowKey
    displayname
    externalsourceid
    sourcetype
    pipelinekey
    rank
    reportingcategory
  }
}`;

export const streams = `fragment StreamsView on StreamCollection {
  streams {
    streamId
    pipelineKey
    pipelineLabel
    pipelineIcon
    streamFactory
    params {
      key
      value
    }
    enabled
  }
}`;
