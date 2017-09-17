const graphql = require('graphql');

module.exports = graphql.buildSchema(`
  type Query {
    sites: SiteCollection
    streams: StreamCollection
    trustedSources(pipelinekeys: [String]!, sourcename: String): SourceCollection
    siteTerms(translationLanguage: String): TermCollection
    twitterAccounts: TwitterAccountCollection
    trustedTwitterAccounts(siteId: String!): TrustedTwitterAccountCollection
    facebookPages(siteId: String!): FacebookPageCollection
    facebookAnalytics(siteId: String!, days: Int!): FacebookPageAnalyticsCollection
    termBlacklist: BlacklistCollection
  }

  type Mutation {
    createSite(input: EditableSiteSettings!): Site
    removeKeywords(input: MutatedTerms): TermCollection
    addKeywords(input: MutatedTerms): TermCollection
    removeSite(input: EditableSiteSettings!): Site
    editSite(input: EditableSiteSettings!): Site
    modifyStreams(input: StreamListInput!): StreamCollection
    removeStreams(input: StreamListInput!): StreamCollection
    removeFacebookPages(input: FacebookPageListInput!): FacebookPageCollection
    modifyFacebookPages(input: FacebookPageListInput!): FacebookPageCollection
    createOrReplaceSite(input: SiteDefinition!): Site
    modifyTwitterAccounts(input: TwitterAccountDefintion!): TwitterAccountCollection
    removeTwitterAccounts(input: TwitterAccountDefintion!): TwitterAccountCollection
    modifyTrustedTwitterAccounts(input: TrustedTwitterAccountDefintion!): TrustedTwitterAccountCollection
    removeTrustedTwitterAccounts(input: TrustedTwitterAccountDefintion!): TrustedTwitterAccountCollection
    modifyBlacklist(input: BlacklistTermDefintion!): BlacklistCollection
    removeBlacklist(input: BlacklistTermDefintion!): BlacklistCollection
  }

  type SiteProperties {
    targetBbox: [Float],
    defaultZoomLevel: Int,
    logo: String,
    title: String,
    defaultLocation: [Float],
    defaultLanguage: String,
    storageConnectionString: String,
    featuresConnectionString: String,
    featureservicenamespace: String,
    mapzenApiKey: String,
    fbToken: String,
    supportedLanguages: [String],
    translationSvcToken: String,
    cogSpeechSvcToken: String,
    cogVisionSvcToken: String,
    cogTextSvcToken: String  
  }

  input Term {
    name: String!
    translatedname: String
    namelang: String
    translatednamelang: String
  }

  type SiteTerm {
    topicid: String,
    name: String!,
    translatedname: String,
    namelang: String,
    translatednamelang: String
  }

  input MutatedTerms {
    edges: [Term]!
    site: String!
  }

  type TermCollection {
    runTime: String
    edges: [SiteTerm]!
  }

  type SourceCollection {
    sources: [Source]!
  }

  type Source {
    externalsourceid: String
    sourcetype: String
    pipelinekey: String
    rank: String
  }

  type Site {
    name: String!,
    properties: SiteProperties!
  }

  type SiteCollection {
    runTime: String,
    site: Site!,
  }

  type StreamCollection {
    runTime: String,
    streams: [Stream]!
  }

  type ParamsEntry {   
    key: String!,    
    value: String!  
  }

  type Stream {
    streamId: String!,
    pipelineKey: String!,
    pipelineLabel: String!,
    pipelineIcon: String!,
    streamFactory: String!,
    params: [ParamsEntry]!,
    enabled: Boolean!
  }

  type TwitterAccountCollection {
    runTime: String,
    accounts: [TwitterAccount]
  }

  type TrustedTwitterAccountCollection {
    runTime: String,
    accounts: [TrustedTwitterAcct],
  }

  type FacebookPageCollection {
    runTime: String,
    pages: [FacebookPage]!,
  }

  type FacebookPageAnalyticsCollection{
    analytics: [FacebookPageAnalytics]!
  }

  type FacebookPage {
    RowKey: String
    pageUrl: String
  }

  type TrustedTwitterAcct {
    RowKey: String
    acctUrl: String
  }

  type FacebookPageAnalytics{
    Name: String,
    Count: Int,
    LastUpdated: String
  }

  type TwitterAccount {
    userIds: String!,
    consumerKey: String!,
    consumerSecret: String!,
    accessToken: String!,
    accessTokenSecret: String!
  }

  input SiteDefinition {
    siteType: String,
    targetBbox: [Float],
    defaultZoomLevel: Int,
    logo: String,
    title: String,
    name: String,
    defaultLocation: [Float],
    storageConnectionString: String,
    featuresConnectionString: String,
    mapzenApiKey: String,
    fbToken: String,
    supportedLanguages: [String]
  }

  input EditableSiteSettings {
    siteType: String,
    targetBbox: [Float],
    defaultZoomLevel: Int,
    defaultLanguage: String,
    logo: String,
    title: String,
    name: String,
    defaultLocation: [Float],
    supportedLanguages: [String],
    translationSvcToken: String,
    cogSpeechSvcToken: String,
    cogVisionSvcToken: String,
    cogTextSvcToken: String,
    featureservicenamespace: String
  }

  input ParamsEntryInput {   
    key: String!,    
    value: String!  
  }

  input StreamInput {
    streamId: String!,
    pipelineKey: String!,
    pipelineLabel: String!,
    pipelineIcon: String!,
    streamFactory: String!,
    params: [ParamsEntryInput]!,
    enabled: Boolean!
  }

  input StreamListInput {
    streams: [StreamInput]!
  }

  input TwitterAccountDefintion {
    accounts: [TwitterAccountInput]!
    site: String!
  }

  input TrustedTwitterAccountDefintion {
    accounts: [TrustedTwitterInput]!
    site: String!
  }

  input TwitterAccountInput {
    userIds: String!,
    consumerKey: String!,
    consumerSecret: String!,
    accessToken: String!,
    accessTokenSecret: String!
  }

  input TrustedTwitterInput {
    acctUrl: String
    RowKey: String!
  }

  input FacebookPageInput {
    pageUrl: String
    RowKey: String!
  }

  input FacebookPageListInput {
    pages: [FacebookPageInput]!
    site: String!
  }

  type BlacklistCollection {
    runTime: String,
    filters: [TermFilter]!,
  }

  type TermFilter {
    id: String!,
    filteredTerms: [String]
  }

  input BlacklistTermDefintion {
    filters: [TermFilterInput]!
  }

  input TermFilterInput {
    id: String,
    filteredTerms: [String]
  }
`);