import values from 'lodash/values';

const defaultStreamMap = {
  Bing: {
    pipelineKey: 'Bing',
    pipelineLabel: 'Bing',
    pipelineIcon: 'Bing Icon',
    streamFactory: 'Bing',
    enabled: true,
    shownToUser: false
  },
  EventHub: {
    pipelineKey: 'EventHub',
    pipelineLabel: 'EventHub',
    pipelineIcon: 'EventHub Icon',
    streamFactory: 'EventHub',
    enabled: true,
    shownToUser: false
  },
  FacebookComment: {
    pipelineKey: 'FacebookComment',
    pipelineLabel: 'FacebookComment',
    pipelineIcon: 'Facebook Comment Icon',
    streamFactory: 'FacebookComment',
    enabled: true,
    shownToUser: false
  },
  FacebookPost: {
    pipelineKey: 'FacebookPost',
    pipelineLabel: 'FacebookPost',
    pipelineIcon: 'Facebook Post Icon',
    streamFactory: 'FacebookPost',
    enabled: true,
    shownToUser: false
  },
  HTML: {
    pipelineKey: 'HTML',
    pipelineLabel: 'HTML',
    pipelineIcon: 'HTML Icon',
    streamFactory: 'HTML',
    enabled: true,
    shownToUser: false
  },
  InstagramLocation: {
    pipelineKey: 'InstagramLocation',
    pipelineLabel: 'InstagramLocation',
    pipelineIcon: 'Instagram Location Icon',
    streamFactory: 'InstagramLocation',
    enabled: true,
    shownToUser: false
  },
  InstagramTag: {
    pipelineKey: 'InstagramTag',
    pipelineLabel: 'InstagramTag',
    pipelineIcon: 'Instagram Tag Icon',
    streamFactory: 'InstagramTag',
    enabled: true,
    shownToUser: false
  },
  RSS: {
    pipelineKey: 'RSS',
    pipelineLabel: 'RSS',
    pipelineIcon: 'RSS Icon',
    streamFactory: 'RSS',
    enabled: true,
    shownToUser: true
  },
  Radio: {
    pipelineKey: 'Radio',
    pipelineLabel: 'Radio',
    pipelineIcon: 'Radio Icon',
    streamFactory: 'Radio',
    enabled: true,
    shownToUser: false
  },
  Reddit: {
    pipelineKey: 'Reddit',
    pipelineLabel: 'Reddit',
    pipelineIcon: 'Reddit Icon',
    streamFactory: 'Reddit',
    enabled: true,
    shownToUser: false
  },
  Twitter: {
    pipelineKey: 'Twitter',
    pipelineLabel: 'Twitter',
    pipelineIcon: 'fa fa-Twitter',
    streamFactory: 'Twitter',
    enabled: true,
    shownToUser: true
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
          enum: (values(defaultStreamMap).filter(defaultStream => defaultStream.shownToUser).map(defaultStream => defaultStream.pipelineKey)),
          default: defaultStreamMap.RSS.pipelineKey
        },
        pipelineLabel: {
          type: 'string',
          enum: (values(defaultStreamMap).filter(defaultStream => defaultStream.shownToUser).map(defaultStream => defaultStream.pipelineLabel)),
          default: defaultStreamMap.RSS.pipelineLabel
        },
        pipelineIcon: {
          type: 'string',
          enum: (values(defaultStreamMap).filter(defaultStream => defaultStream.shownToUser).map(defaultStream => defaultStream.pipelineIcon)),
          default: defaultStreamMap.RSS.pipelineIcon
        },
        streamFactory: {
          type: 'string',
          enum: (values(defaultStreamMap).filter(defaultStream => defaultStream.shownToUser).map(defaultStream => defaultStream.streamFactory)),
          default: defaultStreamMap.RSS.streamFactory
        },
        enabled: {
          type: 'boolean',
          default: true
        },
        params: {
          type: 'object'
        }
      },
      dependencies: {
        pipelineKey: {
          oneOf: [
            /*
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
                  title: 'Bing Stream Parameters',
                  type: 'object',
                  properties: {
                    accessToken: {
                      title: 'Access Token',
                      type: 'string',
                      pattern: '\\w+'
                    },
                    searchInstanceId: {
                      title: 'Search Instance Id',
                      type: 'string',
                      pattern: '\\w+'
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
                    'EventHub'
                  ]
                },
                pipelineLabel: {
                  type: 'string',
                  default: defaultStreamMap.EventHub.pipelineLabel
                },
                pipelineIcon: {
                  type: 'string',
                  default: defaultStreamMap.EventHub.pipelineIcon
                },
                streamFactory: {
                  type: 'string',
                  default: defaultStreamMap.EventHub.streamFactory
                },
                enabled: {
                  type: 'boolean',
                  default: defaultStreamMap.EventHub.enabled
                },
                params: {
                  title: 'Event Hub Stream Parameters',
                  type: 'object',
                  properties: {
                    namespace: {
                      title: 'Namespace',
                      type: 'string',
                      pattern: '\\w+'
                    },
                    name: {
                      title: 'Name',
                      type: 'string',
                      pattern: '\\w+'
                    },
                    policyName: {
                      title: 'Policy Name',
                      type: 'string',
                      pattern: '\\w+'
                    },
                    policyKey: {
                      title: 'Policy Key',
                      type: 'string',
                      pattern: '\\w+'
                    },
                    partitionCount: {
                      title: 'Partition Count',
                      type: 'number'
                    },
                    consumerGroup: {
                      title: 'Consumer Group',
                      type: 'string',
                      pattern: '\\w+'
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
            */
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
                      title: 'Twitter User Ids',
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
    streamId: {
      "ui:widget": "hidden"
    },
    pipelineLabel: {
      "ui:widget": "hidden"
    },
    pipelineIcon: {
      "ui:widget": "hidden"
    },
    streamFactory: {
      "ui:widget": "hidden"
    },
    enabled: {
      "ui:widget": "hidden"
    },
    params: {
      accessToken: {
        classNames: "settings secret"
      },
      searchInstanceId: {
        classNames: "settings secret"
      },
      policyKey: {
        classNames: "settings secret"
      },
      consumerKey: {
        classNames: "settings secret"
      },
      consumerSecret: {
        classNames: "settings secret"
      },
      accessTokenSecret: {
        classNames: "settings secret"
      },
    }
  }
};

module.exports = {
  defaultStreamMap,
  schema,
  uiSchema
};