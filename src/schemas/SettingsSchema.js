var graphql = require('graphql');

module.exports = graphql.buildSchema(`
  type SiteProperties {
    targetBbox: [Float],
    defaultZoomLevel: Int,
    logo: String,
    title: String,
    defaultLocation: [Float],
    storageConnectionString: String,
    featuresConnectionString: String,
    mapzenApiKey: String,
    fbToken: String,
    supportedLanguages: [String]
  }

  type Site {
    name: String!,
    properties: SiteProperties!
  }

  type SiteCollection {
    runTime: String,
    sites: [Site]!,
  }

  type TwitterAccountCollection {
    runTime: String,
    accounts: [TwitterAccount],
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

  type BlacklistCollection {
    runTime: String,
    filters: [TermFilter]!,
  }

  type TermFilter {
    filteredTerms: [String],
    lang: String,
    RowKey: String
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
    accountName: String,
    consumerKey: String,
    consumerSecret: String,
    token: String,
    tokenSecret: String
  }

  input SiteDefinition {
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

  input TwitterAccountDefintion {
    accounts: [TwitterAccountInput]!
    site: String!
  }

  input TrustedTwitterAccountDefintion {
    accounts: [TrustedTwitterInput]!
    site: String!
  }

  input BlacklistTermDefintion {
    terms: [BlacklistTermInput]!
    site: String!
  }

  input TwitterAccountInput {
    accountName: String!,
    consumerKey: String!,
    consumerSecret: String!,
    token: String!,
    tokenSecret: String!
  }

  input TrustedTwitterInput {
    acctUrl: String
    RowKey: String!
  }

  input BlacklistTermInput {
    filteredTerms: [String],
    lang: String,
    RowKey: String
  }

  input FacebookPageInput {
    pageUrl: String
    RowKey: String!
  }

  input FacebookPageListInput {
    pages: [FacebookPageInput]!
    site: String!
  }

  type Query {
    sites(siteId: String): SiteCollection
    twitterAccounts(siteId: String!): TwitterAccountCollection
    trustedTwitterAccounts(siteId: String!): TrustedTwitterAccountCollection
    facebookPages(siteId: String!): FacebookPageCollection
    facebookAnalytics(siteId: String!, days: Int!): FacebookPageAnalyticsCollection
    termBlacklist(siteId: String!): BlacklistCollection
  }

  type Mutation {
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
`);