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
    }
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

export const topics = `fragment TopicsView on TermCollection {
  edges {
      topicid
      name
      translatedname
      namelang
      translatednamelang
  }
}`;
