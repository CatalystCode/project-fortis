const streams = [
  { 
    'pipelineKey': 'twitter',
    'pipelineLabel': 'Twitter',
    'pipelineIcon': '',
    'streamFactory': 'TwitterstreamFactory',
    'params': {
      '1': '1',
      '2': '2',
      '3': '3',
      '4': '4'
    },
    'enabled': false
  },
  { 
    'pipelineKey': 'facebookpost',
    'pipelineLabel': 'Facebook',
    'pipelineIcon': '',
    'streamFactory': 'FacebookPagestreamFactory',
    'params': {
      '1': '1'
    },
    'enabled': false
  },
  { 
    'pipelineKey': 'facebookcomment',
    'pipelineLabel': 'Facebook',
    'pipelineIcon': '',
    'streamFactory': 'FacebookCommentstreamFactory',
    'params': {
      '1': '1'
    },
    'enabled': false
  },
  { 
    'pipelineKey': 'instagram',
    'pipelineLabel': 'Instagram',
    'pipelineIcon': '',
    'streamFactory': 'InstagramLocationstreamFactory',
    'params': {
      '1': '1'
    },
    'enabled': false
  },
  { 
    'pipelineKey': 'instagram',
    'pipelineLabel': 'Instagram',
    'pipelineIcon': '',
    'streamFactory': 'InstagramTagstreamFactory',
    'params': {
      '1': '1'
    },
    'enabled': false
  },
  { 
    'pipelineKey': 'tadaweb',
    'pipelineLabel': 'Tadaweb',
    'pipelineIcon': '',
    'streamFactory': '',
    'params': {
      '1': '1'
    },
    'enabled': false
  },
  { 
    'pipelineKey': 'customevents',
    'pipelineLabel': 'Custom Events',
    'pipelineIcon': '',
    'streamFactory': 'EventHubstreamFactory',
    'params': {
      '1': '1'
    },
    'enabled': false
  },
  { 
    'pipelineKey': 'bing',
    'pipelineLabel': 'Bing',
    'pipelineIcon': '',
    'streamFactory': 'BingPagestreamFactory',
    'params': {
      '1': '1'
    },
    'enabled': false
  },
  { 
    'pipelineKey': 'radio',
    'pipelineLabel': 'Radio',
    'pipelineIcon': '',
    'streamFactory': 'RadiostreamFactory',
    'params': {
      '1': '1'
    },
    'enabled': false
  },
  { 
    'pipelineKey': 'reddit',
    'pipelineLabel': 'Reddit',
    'pipelineIcon': '',
    'streamFactory': 'RedditstreamFactory',
    'params': {
      '1': '1'
    },
    'enabled': false
  }
];

module.exports = {
  streams: streams
};