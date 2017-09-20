const TABLES = {
  watchlist: 'watchlist',
  blacklist: 'blacklist',
  sitesettings: 'sitesettings',
  streams: 'streams',
  trustedsources: 'trustedsources',
  computedtiles: 'computedtiles',
  heatmap: 'heatmap',
  popularplaces: 'popularplaces',
  conjunctivetopics: 'conjunctivetopics',
  eventtopics: 'eventtopics',
  eventplaces: 'eventplaces',
  computedtrends: 'computedtrends',
  events: 'events'
};

const OPERATIONS = {
  create: 'create',
  modify: 'modify',
  remove: 'delete'
};

const COLLECTIONS = {
  site: 'site',
  streams: 'streams',
  accounts: 'accounts',
  filters: 'filters',
  sources: 'sources'
};

module.exports = {
  TABLES: TABLES,
  OPERATIONS: OPERATIONS,
  COLLECTIONS: COLLECTIONS
};