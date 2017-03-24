var graphql = require('graphql');
 
module.exports = graphql.buildSchema(`
  type Query {
    byBbox(site: String!, originalSource: String, bbox: [Float]!, mainTerm: String, filteredEdges: [String]!, langCode: String!, 
               limit: Int, offset: Int, fromDate: String!, toDate: String!,
               sourceFilter: [String], fulltextTerm: String): FeatureCollection
    byLocation(site: String!, originalSource: String, coordinates: [Float]!, filteredEdges: [String]!, langCode: String!, 
               limit: Int, offset: Int, fromDate: String!, toDate: String!,
               sourceFilter: [String], fulltextTerm: String): FeatureCollection
    byEdges(site: String!, originalSource: String, filteredEdges: [String]!, langCode: String!, 
            limit: Int, offset: Int, fromDate: String!, toDate: String!,
            sourceFilter: [String], fulltextTerm: String): FeatureCollection
    event(site: String!, messageId: String!, dataSources: [String]!, langCode: String): Feature,
    translate(sentence: String!, fromLanguage: String!, toLanguage: String!): TranslationResult
    translateWords(words: [String]!, fromLanguage: String!, toLanguage: String!): TranslatedWords
  }

  type Mutation {
    publishEvents(input: NewMessages): [String]
  }

  input NewMessages {
    messages: [IncomingMessage]!
  }

  input IncomingMessage{
    RowKey: String!
    created_at: String!
    featureCollection: EventFeatureCollection!
    message: String!
    language: String!
    link: String
    source: String
    title: String
  }

  input EventFeatureCollection {
    type: String
    features: [EventFeature]!
  }

  input EventFeature {
    type: String
    coordinates: [Float]!
  }

  type TranslatedWords{
    words: [TranslationResult]
  }

  type TranslationResult{
    originalSentence: String
    translatedSentence: String
  }

  enum TypeEnum {
    FeatureCollection
  }

  type FeatureCollection {
    runTime: String,
    type: TypeEnum!,
    bbox: [Float],
    features: [Feature]!,
  }

  enum FeatureType {
    MultiPoint
  }

  type Feature {
    type: FeatureType,
    coordinates: [[Float]],
    properties: Message!
  }

  type Message {
    edges: [String],
    messageid: ID,
    createdtime: String,
    sentiment: Float,
    title: String,
    originalSources: [String],
    sentence: String,
    language: String,
    source: String,
    properties: MessageProperties,
    fullText: String
  }

  type MessageProperties {
    retweetCount: Int,
    fatalaties: Int,
    userConnecionCount: Int,
    actor1: String,
    actor2: String,
    actor1Type: String,
    actor2Type: String,
    incidentType: String,
    allyActor1: String,
    allyActor2: String,
    title: String,
    link: String,
    originalSources: [String]
  }
`);