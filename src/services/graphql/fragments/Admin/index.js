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
  }
}`;

export const twitterAccounts = `fragment TwitterAccountsView on TwitterAccountCollection {
  accounts {
    userIds
    consumerKey
    consumerSecret
    accessToken
    accessTokenSecret
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
