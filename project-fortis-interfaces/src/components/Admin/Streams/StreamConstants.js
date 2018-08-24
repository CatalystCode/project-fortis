import React from 'react';
import values from 'lodash/values';
import keysIn from 'lodash/keysIn';
import { EVENT_SOURCE_ICON_MAP } from '../../../actions/constants';

const supportedAudioTypes = ['Select type', 'mp3', 'wav'];
const redditSearchResultTypes = ['Select type', 'Link', 'Comment', 'Account', 'Message', 'Subreddit', 'Award'];
const speechType = ['Select type', 'interactive', 'dictation', 'conversation'];
const radioOutputFormat = ['Select format', 'simple', 'detailed'];

const supportedLanguagesMap = {
  'Select Language': {
    languageCode: '',
    regions: {
      '': ''
    }
  },
  'English': {
    languageCode: 'en',
    regions: {
      'United States': 'US',
      'Australia': 'AU',
      'Canada': 'CA',
      'United Kingdom': 'GB',
      'Ireland': 'IE',
      'India': 'IN',
    }
  },
  'Arabic' : {
    languageCode: 'ar',
    regions: {
      'Egypt': 'EG',
      'Saudi Arabia': 'SA'
    }
  },
  'Bulgarian': {
    languageCode: 'bg',
    regions: {
      'Bulgaria': 'BG'
    }
  },
  'Catalan': {
    languageCode: 'ca',
    regions: {
      'Spain': 'ES'
    }
  },
  'Chinese': {
    languageCode: 'zh',
    regions: {
      'China': 'CN',
      'Hong Kong': 'HK',
      'Taiwan': 'TW'
    }
  },
  'Croatian': {
    languageCode: 'hr',
    regions: {
      'Croatia': 'HR'
    }
  },
  'Czech': {
    languageCode: 'cs',
    regions: {
      'Czech Republic': 'CZ'
    }
  },
  'Danish': {
    languageCode: 'da',
    regions: {
      'Denmark': 'DK'
    }
  },
  'Dutch': {
    languageCode: 'nl',
    regions: {
      'Netherlands': 'NL'
    }
  },
  'German': {
    languageCode: 'de',
    regions: {
      'Austria': 'AT',
      'Germany': 'DE',
      'Switzerland': 'CH'
    }
  },
  'Greek': {
    languageCode: 'el',
    regions: {
      'Greece': 'GR'
    }
  },
  'Spanish': {
    languageCode: 'es',
    regions: {
      'Mexico': 'MX',
      'Spain': 'ES'
    }
  },
  'Finnish': {
    languageCode: 'fi',
    regions: {
      'Finland': 'FI'
    }
  },
  'French': {
    languageCode: 'fr',
    regions: {
      'Canada': 'CA',
      'Switzerland': 'CH',
      'France': 'FR'
    }
  },
  'Hebrew': {
    languageCode: 'he',
    regions: {
      'Israel': 'IL'
    }
  },
  'Hindi': {
    languageCode: 'hi',
    regions: {
      'India': 'IN'
    }
  },
  'Hungarian': {
    languageCode: 'hu',
    regions: {
      'Hungary': 'HU'
    }
  },
  'Indonesian': {
    languageCode: 'id',
    regions: {
      'Indonesia': 'ID'
    }
  },
  'Italian': {
    languageCode: 'it',
    regions: {
      'Italy': 'IT'
    }
  },
  'Japanese': {
    languageCode: 'ja',
    regions: {
      'Japan': 'JP'
    }
  },
  'Korean': {
    languageCode: 'ko',
    regions: {
      'Korea': 'KR'
    }
  },
  'Malay': {
    languageCode: 'ms',
    regions: {
      'Malaysia': 'MY'
    }
  },
  'Norwegian': {
    languageCode: 'no',
    regions: {
      'Norway': 'NO'
    }
  },
  'Polish': {
    languageCode: 'pl',
    regions: {
      'Poland': 'PL'
    }
  },
  'Portuguese': {
    languageCode: 'pt',
    regions: {
      'Brazil': 'BR',
      'Portugal': 'PT'
    }
  },
  'Romanian': {
    languageCode: 'ro',
    regions: {
      'Romania': 'RO'
    }
  },
  'Russian': {
    languageCode: 'ru',
    regions: {
      'Russia': 'RU'
    }
  },
  'Slovak': {
    languageCode: 'sk',
    regions: {
      'Slovakia': 'SK'
    }
  },
  'Slovenian': {
    languageCode: 'sl',
    regions: {
      'Slovenia': 'SL'
    }
  },
  'Swedish': {
    languageCode: 'sv',
    regions: {
      'Sweden': 'SE'
    }
  },
  'Tamil': {
    languageCode: 'ta',
    regions: {
      'India': 'IN'
    }
  },
  'Thai': {
    languageCode: 'th',
    regions: {
      'Thailand': 'TH'
    }
  },
  'Turkish': {
    languageCode: 'tr',
    regions:  {
      'Turkey': 'TR'
    }
  },
  'Vietnamese': {
    languageCode: 'vi',
    regions: {
      'Vietnam': 'VN'
    }
  }
};

const getRegionPropertiesList = () => {
  return keysIn(supportedLanguagesMap).map(supportedLanguage => ({
    properties: {
      language: {
        'enum': [
          supportedLanguage
        ]
      },
      region: {
        title: 'Region',
        type: 'string',
        enum: keysIn(supportedLanguagesMap[supportedLanguage].regions)
      }
    },
    required: [
      'language',
      'region'
    ]
  }));
}

const defaultStreamMap = {
  Bing: {
    pipelineKey: 'Bing',
    pipelineLabel: 'Bing',
    pipelineIcon: EVENT_SOURCE_ICON_MAP.bing,
    streamFactory: 'BingPage',
    enabled: true
  },
  CustomEvent : {
    pipelineKey: 'CustomEvent',
    pipelineLabel: 'Custom Event',
    pipelineIcon: EVENT_SOURCE_ICON_MAP.customEvent,
    streamFactory: 'CustomEvents',
    enabled: true
  },
  Facebook: {
    pipelineKey: 'Facebook',
    pipelineLabel: 'Facebook',
    pipelineIcon: EVENT_SOURCE_ICON_MAP.facebook,
    streamFactory: 'FacebookPage',
    enabled: true
  },
  HTML: {
    pipelineKey: 'HTML',
    pipelineLabel: 'HTML',
    pipelineIcon: EVENT_SOURCE_ICON_MAP.html,
    streamFactory: 'HTML',
    enabled: true
  },
  Instagram: {
    pipelineKey: 'Instagram',
    pipelineLabel: 'Instagram',
    pipelineIcon: EVENT_SOURCE_ICON_MAP.instagram,
    streamFactory: 'InstagramTag',
    enabled: true
  },
  RSS: {
    pipelineKey: 'RSS',
    pipelineLabel: 'RSS',
    pipelineIcon: EVENT_SOURCE_ICON_MAP.rss,
    streamFactory: 'RSS',
    enabled: true
  },
  Radio: {
    pipelineKey: 'Radio',
    pipelineLabel: 'Radio',
    pipelineIcon: EVENT_SOURCE_ICON_MAP.radio,
    streamFactory: 'Radio',
    enabled: true
  },
  Reddit: {
    pipelineKey: 'Reddit',
    pipelineLabel: 'Reddit',
    pipelineIcon: EVENT_SOURCE_ICON_MAP.reddit,
    streamFactory: 'RedditObject',
    enabled: true
  },
  TadaWeb: {
    pipelineKey: 'TadaWeb',
    pipelineLabel: 'TadaWeb',
    pipelineIcon: EVENT_SOURCE_ICON_MAP.tadaweb,
    streamFactory: 'Tadaweb',
    enabled: true
  },
  Twitter: {
    pipelineKey: 'Twitter',
    pipelineLabel: 'Twitter',
    pipelineIcon: EVENT_SOURCE_ICON_MAP.twitter,
    streamFactory: 'Twitter',
    enabled: true
  }
};

const schema = {
  type: 'object',
  properties: { 
    stream: {
      $ref: "#/definitions/stream"
    }
  },
  definitions: {
    stream: {
      title: '',
      type: 'object',
      properties: {
        streamId: {
          type: 'string',
          default: ''
        },
        pipelineKey: {
          title: 'Stream Type',
          type: 'string',
          enum: (values(defaultStreamMap).map(defaultStream => defaultStream.pipelineKey)),
          default: defaultStreamMap.Bing.pipelineKey
        },
        pipelineLabel: {
          type: 'string',
          enum: (values(defaultStreamMap).map(defaultStream => defaultStream.pipelineLabel)),
          default: defaultStreamMap.Bing.pipelineLabel
        },
        pipelineIcon: {
          type: 'string',
          enum: (values(defaultStreamMap).map(defaultStream => defaultStream.pipelineIcon)),
          default: defaultStreamMap.Bing.pipelineIcon
        },
        streamFactory: {
          title: 'Source Type',
          type: 'string',
          default: defaultStreamMap.Bing.streamFactory
        },
        enabled: {
          type: 'boolean',
          default: true
        },
        params: {
          type: 'object'
        }
      },
      required: [
        'pipelineKey',
        'streamFactory'
      ],
      dependencies: {
        pipelineKey: {
          oneOf: [
            {
              properties: {
                pipelineKey: {
                  enum: [
                    'Bing'
                  ]
                },
                pipelineLabel: {
                  type: 'string',
                  default: defaultStreamMap.Bing.pipelineLabel
                },
                pipelineIcon: {
                  type: 'string',
                  default: defaultStreamMap.Bing.pipelineIcon
                },
                streamFactory: {
                  type: 'string',
                  default: defaultStreamMap.Bing.streamFactory
                },
                enabled: {
                  type: 'boolean',
                  default: defaultStreamMap.Bing.enabled
                },
                params: {
                  title: 'Bing Custom Search Parameters',
                  type: 'object',
                  properties: {
                    accessToken: {
                      title: 'Bing Custom Search API Key',
                      type: 'string',
                      pattern: '([A-Z]|[a-z]|[0-9])+'
                    },
                    searchInstanceId: {
                      title: 'Custom Configuration Id',
                      type: 'string',
                      pattern: '\\d+'
                    },
                    keywords: {
                      title: 'Keywords',
                      type: 'array',
                      items: {
                        type: 'string'
                      }
                    }
                  },
                  required: [
                    'accessToken',
                    'searchInstanceId',
                    'keywords'
                  ]
                }
              },
            },
            {
              properties: {
                pipelineKey: {
                  enum: [
                    'CustomEvent'
                  ]
                },
                pipelineLabel: {
                  type: 'string',
                  default: defaultStreamMap.CustomEvent.pipelineLabel
                },
                pipelineIcon: {
                  type: 'string',
                  default: defaultStreamMap.CustomEvent.pipelineIcon
                },
                streamFactory: {
                  type: 'string',
                  default: defaultStreamMap.CustomEvent.streamFactory
                },
                enabled: {
                  type: 'boolean',
                  default: defaultStreamMap.CustomEvent.enabled
                },
                params: {
                  title: 'Custom Event Stream Parameters',
                  type: 'object',
                  description: 'To fill in the following parameters, create an event hub for custom events',
                  properties: {
                    namespace: {
                      title: 'Namespace',
                      type: 'string',
                      pattern: '(\\w|-)+'
                    },
                    name: {
                      title: 'Name',
                      type: 'string',
                      pattern: '(\\w|-)+'
                    },
                    policyName: {
                      title: 'Policy Name',
                      type: 'string',
                      pattern: '(\\w|-)+'
                    },
                    policyKey: {
                      title: 'Policy Key',
                      type: 'string',
                      pattern: '(\\w|-)+'
                    },
                    partitionCount: {
                      title: 'Partition Count',
                      type: 'number'
                    },
                    consumerGroup: {
                      title: 'Consumer Group',
                      type: 'string',
                      pattern: '(\\w|-)+'
                    }
                  },
                  required: [
                    'namespace',
                    'name',
                    'policyName',
                    'policyKey',
                    'partitionCount',
                    'consumerGroup'
                  ]
                }
              },
            },
            {
              properties: {
                pipelineKey: {
                  enum: [
                    'Facebook'
                  ]
                },
                pipelineLabel: {
                  type: 'string',
                  default: defaultStreamMap.Facebook.pipelineLabel
                },
                pipelineIcon: {
                  type: 'string',
                  default: defaultStreamMap.Facebook.pipelineIcon
                },
                streamFactory: {
                  type: 'string',
                  default: defaultStreamMap.Facebook.streamFactory
                },
                enabled: {
                  type: 'boolean',
                  default: defaultStreamMap.Facebook.enabled
                },
                params: {
                  title: 'Facebook Parameters',
                  type: 'object',
                  properties: {
                    appId: {
                      title: 'Facebook App Id',
                      type: 'string',
                      pattern: '\\d+'
                    },
                    appSecret: {
                      title: 'Facebook App Secret',
                      type: 'string',
                      pattern: '\\w+'
                    },
                    authToken: {
                      title: 'Facebook Auth Token',
                      type: 'string',
                    }
                  },
                  required: [
                    'appId',
                    'appSecret',
                    'authToken'
                  ]
                }
              },
            },
            {
              properties: {
                pipelineKey: {
                  enum: [
                    'HTML'
                  ]
                },
                pipelineLabel: {
                  type: 'string',
                  default: defaultStreamMap.HTML.pipelineLabel
                },
                pipelineIcon: {
                  type: 'string',
                  default: defaultStreamMap.HTML.pipelineIcon
                },
                streamFactory: {
                  type: 'string',
                  default: defaultStreamMap.Facebook.streamFactory
                },
                enabled: {
                  type: 'boolean',
                  default: defaultStreamMap.HTML.enabled
                },
                params: {
                  title: 'HTML Parameters',
                  type: 'object',
                  properties: {
                    feedUrls: {
                      title: 'HTML Feed Urls',
                      type: 'array',
                      items: {
                        type: 'string',
                        format: 'uri',
                      },
                    },
                    maxDepth: {
                      title: 'Max Depth',
                      type: 'string',
                      pattern: '\\d+'
                    },
                    pollingPeriod: {
                      title: 'Polling Period (seconds)',
                      type: 'string',
                      pattern: '\\d+'
                    },
                    cacheEditDistanceThreshold: {
                      title: 'Cache Edit Distance Threshold',
                      type: 'string',
                      pattern: '\\d+'
                    }
                  },
                  required: [
                    'feedUrls'
                  ]
                }
              },
            },
            {
              properties: {
                pipelineKey: {
                  enum: [
                    'Instagram'
                  ]
                },
                pipelineLabel: {
                  type: 'string',
                  default: defaultStreamMap.Instagram.pipelineLabel
                },
                pipelineIcon: {
                  type: 'string',
                  default: defaultStreamMap.Instagram.pipelineIcon
                },
                streamFactory: {
                  type: 'string',
                  default: defaultStreamMap.Instagram.streamFactory
                },
                enabled: {
                  type: 'boolean',
                  default: defaultStreamMap.Instagram.enabled
                },
                params: {
                  title: 'Instagram Parameters',
                  type: 'object',
                  properties: {
                    authToken: {
                      title: 'Instagram Auth Token',
                      type: 'string'
                    },
                    tag: {
                      title: 'Instagram tag',
                      type:'string'
                    },
                    instagramLocation: {
                      title: 'Instagram Location',
                      type: 'object',
                      properties: {
                        lat: {
                          title: 'Latitude',
                          type: 'number'
                        },
                        long: {
                          title: 'Longitude',
                          type: 'number'
                        }
                      }
                    }
                  },
                  required: [
                    'authToken'
                  ]
                }
              }
            },
            {
              properties: {
                pipelineKey: {
                  enum: [
                    'RSS'
                  ]
                },
                pipelineLabel: {
                  type: 'string',
                  default: defaultStreamMap.RSS.pipelineLabel
                },
                pipelineIcon: {
                  type: 'string',
                  default: defaultStreamMap.RSS.pipelineIcon
                },
                streamFactory: {
                  type: 'string',
                  default: defaultStreamMap.RSS.streamFactory
                },
                enabled: {
                  type: 'boolean',
                  default: defaultStreamMap.RSS.enabled
                },
                params: {
                  title: 'RSS Stream Parameters',
                  type: 'object',
                  properties: {
                    connectionTimeout: {
                      title: 'Connection Timeout (seconds)',
                      type: 'number',
                      default: 3000
                    },
                    readTimeout: {
                      title: 'Read Timeout (seconds)',
                      type: 'number',
                      default: 9000
                    },
                    pollingPeriod: {
                      title: 'Polling Period (seconds)',
                      type: 'number',
                      default: 3600
                    }
                  }
                }
              },
            },
            {
              properties: {
                pipelineKey: {
                  enum: [
                    'Radio'
                  ]
                },
                pipelineLabel: {
                  type: 'string',
                  default: defaultStreamMap.Radio.pipelineLabel
                },
                pipelineIcon: {
                  type: 'string',
                  default: defaultStreamMap.Radio.pipelineIcon
                },
                streamFactory: {
                  type: 'string',
                  default: defaultStreamMap.Radio.streamFactory
                },
                enabled: {
                  type: 'boolean',
                  default: defaultStreamMap.Radio.enabled
                },
                params: {
                  title: 'Radio Stream Parameters',
                  type: 'object',
                  properties: {
                    radioUrl: {
                      title: 'Radio Url',
                      type: 'string',
                      format: 'uri'
                    },
                    audioType: {
                      title: 'Audio Type',
                      enum: supportedAudioTypes,
                      default: supportedAudioTypes[0]
                    },
                    locale: {
                      title: '',
                      type: 'object',
                      properties: {
                        language: {
                          title: 'Language',
                          enum: keysIn(supportedLanguagesMap),
                          default: keysIn(supportedLanguagesMap[0])
                        }
                      },
                      required: [
                        'language'
                      ],
                      dependencies: {
                        language: {
                          oneOf: (getRegionPropertiesList())
                        }
                      }
                    },
                    subscriptionKey: {
                      title: 'Ocp-Apim-Subscription-Key',
                      type: 'string',
                      pattern: '(\\w|-)+'
                    },
                    speechType: {
                      title: 'Speech Type',
                      enum: speechType,
                      default: speechType[0]
                    },
                    outputFormat: {
                      title: 'Output Format',
                      enum: radioOutputFormat,
                      default: radioOutputFormat[0]
                    }
                  },
                  required: [
                    'radioUrl',
                    'subscriptionKey'
                  ]
                }
              },
            },
            {
              properties: {
                pipelineKey: {
                  enum: [
                    'Reddit'
                  ]
                },
                pipelineLabel: {
                  type: 'string',
                  default: defaultStreamMap.Reddit.pipelineLabel
                },
                pipelineIcon: {
                  type: 'string',
                  default: defaultStreamMap.Reddit.pipelineIcon
                },
                streamFactory: {
                  type: 'string',
                  default: defaultStreamMap.Reddit.streamFactory
                },
                enabled: {
                  type: 'boolean',
                  default: defaultStreamMap.Reddit.enabled
                },
                params: {
                  title: 'Reddit Stream Parameters',
                  type: 'object',
                  properties: {
                    applicationId: {
                      title: 'Reddit App Id',
                      type: 'string'
                    },
                    applicationSecret: {
                      title: 'Reddit App Secret',
                      type: 'string'
                    },
                    keywords: {
                      title: 'Keywords',
                      type: 'array',
                      items: {
                        type: 'string'
                      }
                    },
                    subreddit: {
                      title: 'Subreddit',
                      type: 'string'
                    },
                    searchLimit: {
                      title: 'Search Limit',
                      type: 'number'
                    },
                    searchResultType: {
                      title: 'Search Results Type',
                      enum: redditSearchResultTypes,
                      default: redditSearchResultTypes[0]
                    }
                  },
                  required: [
                    'applicationId',
                    'applicationSecret',
                    'keywords',
                    'subreddit'
                  ]
                }
              },
            },
            {
              properties: {
                pipelineKey: {
                  enum: [
                    'TadaWeb'
                  ]
                },
                pipelineLabel: {
                  type: 'string',
                  default: defaultStreamMap.TadaWeb.pipelineLabel
                },
                pipelineIcon: {
                  type: 'string',
                  default: defaultStreamMap.TadaWeb.pipelineIcon
                },
                streamFactory: {
                  type: 'string',
                  default: defaultStreamMap.TadaWeb.streamFactory
                },
                enabled: {
                  type: 'boolean',
                  default: defaultStreamMap.TadaWeb.enabled
                },
                params: {
                  title: 'TadaWeb Stream Parameters',
                  type: 'object',
                  description: 'To fill in the following parameters, create an event hub for TadaWeb',
                  properties: {
                    namespace: {
                      title: 'Namespace',
                      type: 'string',
                      pattern: '(\\w|-)+'
                    },
                    name: {
                      title: 'Name',
                      type: 'string',
                      pattern: '(\\w|-)+'
                    },
                    policyName: {
                      title: 'Policy Name',
                      type: 'string',
                      pattern: '(\\w|-)+'
                    },
                    policyKey: {
                      title: 'Policy Key',
                      type: 'string',
                      pattern: '(\\w|-)+'
                    },
                    partitionCount: {
                      title: 'Partition Count',
                      type: 'number'
                    },
                    consumerGroup: {
                      title: 'Consumer Group',
                      type: 'string',
                      pattern: '(\\w|-)+'
                    }
                  },
                  required: [
                    'namespace',
                    'name',
                    'policyName',
                    'policyKey',
                    'partitionCount',
                    'consumerGroup'
                  ]
                }
              },
            },
            {
              properties: {
                pipelineKey: {
                  enum: [
                    'Twitter'
                  ]
                },
                pipelineLabel: {
                  type: 'string',
                  default: defaultStreamMap.Twitter.pipelineLabel
                },
                pipelineIcon: {
                  type: 'string',
                  default: defaultStreamMap.Twitter.pipelineIcon
                },
                streamFactory: {
                  type: 'string',
                  default: defaultStreamMap.Twitter.streamFactory
                },
                enabled: {
                  type: 'boolean',
                  default: defaultStreamMap.Twitter.enabled
                },
                params: {
                  title: 'Twitter Stream Parameters',
                  type: 'object',
                  properties: {
                    consumerKey: {
                      title: 'Consumer Key',
                      type: 'string',
                      pattern: '\\w+'
                    },
                    consumerSecret: {
                      title: 'Consumer Secret',
                      type: 'string',
                      pattern: '\\w+'
                    },
                    accessToken: {
                      title: 'Access Token',
                      type: 'string',
                      pattern: '\\w+'
                    },
                    accessTokenSecret: {
                      title: 'Access Token Secret',
                      type: 'string',
                      pattern: '\\w+'
                    },
                    watchlistFilteringEnabled: {
                      title: 'Watchlist Filtering Enabled',
                      type: 'boolean'
                    },
                    userIds: {
                      title: 'Twitter User Ids (without leading @ symbol)',
                      type: 'array',
                      items: {
                        type: 'string'
                      }
                    }
                  },
                  required: [
                    'consumerKey',
                    'consumerSecret',
                    'accessToken',
                    'accessTokenSecret',
                    'userIds'
                  ]
                }
              }
            }
          ]
        }
      }
    }
  }
};

const uiSchema = {
  stream: {
    enabled: {
      "ui:widget": "hidden"
    },
    pipelineIcon: {
      "ui:widget": "hidden"
    },
    pipelineLabel: {
      "ui:widget": "hidden"
    },
    streamId: {
      "ui:widget": "hidden"
    },
    streamFactory: {
      "ui:widget": "hidden"
    },
    params: {
      accessToken: {
        classNames: "settings secret",
        "ui:description": <a href="https://azure.microsoft.com/try/cognitive-services/" target="_blank" rel="noopener noreferrer">Get API Access Token</a>
      },
      accessTokenSecret: {
        classNames: "settings secret"
      },
      appId: {
        "ui:description": <a href="https://developers.facebook.com/quickstarts/" target="_blank" rel="noopener noreferrer">Create a facebook app id</a> 
      },
      appSecret: {
        "ui:description": <a href="https://developers.facebook.com/quickstarts/" target="_blank" rel="noopener noreferrer">Create a facebook app secret</a> 
      },
      applicationId: {
        "ui:description": <a href="https://www.reddit.com/wiki/api" target="_blank" rel="noopener noreferrer">Sign up here to get a reddit app id</a>
      },
      applicationSecret: {
        classNames: "settings secret"
      },
      audioType: {
        "ui:description": <a href="https://docs.microsoft.com/en-us/azure/cognitive-services/speech/api-reference-rest/websocketprotocol#message-audio" target="_blank" rel="noopener noreferrer">More information on Audio Types</a>
      },
      cacheEditDistanceThreshold: {
        "ui:placeholder": "0.0001"
      },
      connectionTimeout: {
        "ui:placeholder": "3000"
      },
      consumerKey: {
        classNames: "settings secret"
      },
      consumerSecret: {
        classNames: "settings secret"
      },
      feedUrls: {
        items: {
          "ui:placeholder": "http://"
        }
      },
      instagramLocation: {
        lat: {
          "ui:placeholder": "42.37"
        },
        long: {
          "ui:placeholder": "-71.11"
        }
      },
      maxDepth: {
        "ui:placeholder": "1"
      },
      policyKey: {
        classNames: "settings secret"
      },
      pollingPeriod: {
        "ui:placeholder": "3600"
      },
      subscriptionKey: {
        "ui:description": <a href="https://docs.microsoft.com/en-us/azure/cognitive-services/speech/how-to/how-to-authentication?tabs=Powershell#use-a-subscription-key" target="_blank" rel="noopener noreferrer">Get a subscription key</a>
      },
      radioUrl: {
        "ui:placeholder": "http://"
      },
      readTimeout: {
        "ui:placeholder": "9000"
      },
      searchLimit: {
        "ui:description": "The maximum number of items returned from a search",
        "ui:placeholder": "25"
      },
      searchInstanceId: {
        classNames: "settings secret",
        "ui:description": <a href="https://docs.microsoft.com/en-us/azure/cognitive-services/bing-custom-search/quick-start" target="_blank" rel="noopener noreferrer">Create a Bing Custom Configuration Id</a> 
      }
    }
  }
};

module.exports = {
  defaultStreamMap,
  supportedLanguagesMap,
  schema,
  uiSchema
};
