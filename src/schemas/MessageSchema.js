const graphql = require('graphql');

module.exports = graphql.buildSchema(`
  type Query {
    byBbox(externalsourceid: String, bbox: [Float]!, conjunctivetopics: [String]!, 
           limit: Int, pageState: String, zoomLevel: Int!, fromDate: String!, toDate: String!,  
           pipelinekeys: [String]!, fulltextTerm: String): FeatureCollection
    byLocation(site: String!, originalSource: String, coordinates: [Float]!, mainTerm: String, filteredEdges: [String]!, langCode: String!, limit: Int, offset: Int, fromDate: String!, toDate: String!, sourceFilter: [String], fulltextTerm: String): FeatureCollection
    byEdges(site: String!, mainTerm: String, 
            filteredEdges: [String]!, langCode: String!, 
            limit: Int, offset: Int, fromDate: String!, 
            toDate: String!, sourceFilter: [String], fulltextTerm: String): FeatureCollection
    event(site: String!, messageId: String!): Feature
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
    pageState: String,
    bbox: [Float],
    features: [Feature]!,
  }

  enum FeatureType {
    MultiPoint,
    Point
  }

  type Feature {
    type: FeatureType,
    coordinates: [[Float]],
    properties: Message!
  }

  type Message {
    edges: [String],
    messageid: ID,
    eventtime: String,
    sourceeventid: String,
    sentiment: Float,
    entities: [String],
    title: String,
    externalsourceid: String,
    summary: String,
    language: String,
    pipelinekey: String,
    fullText: String,
    link: String
  }
`);