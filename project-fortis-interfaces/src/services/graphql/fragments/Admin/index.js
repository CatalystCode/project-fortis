export const users = `fragment UsersView on UserCollection {
  users {
    identifier,
    role
  }
}`

export const siteSettingsFragment = `fragment FortisSiteDefinitionView on SiteCollection {
  site {
    name
    properties {
        targetBbox
        defaultZoomLevel
        logo
        title
        fbToken
        mapSvcToken
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
      mapSvcToken
      translationSvcToken
      cogSpeechSvcToken
      cogVisionSvcToken
      cogTextSvcToken
    }
  }
}`;

export const topics = `fragment TopicsView on SiteTerms {
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
    isLocation
  }
}`;

export const trustedsources = `fragment TrustedSourcesView on SourceCollection {
  sources {
    rowKey
    displayname
    externalsourceid
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
