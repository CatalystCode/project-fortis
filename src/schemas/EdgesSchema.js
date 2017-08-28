const graphql = require('graphql');

module.exports = graphql.buildSchema(`
  type Query {
    conjunctiveTerms(maintopic: String!, fromDate: String!, periodType: String!, toDate: String!, pipelinekeys: [String]!, bbox: [Float]!, zoomLevel: Int!, externalsourceid: String!): ConjunctionTermCollection
    timeSeries(maintopics: [String]!, fromDate: String!, toDate: String!, periodType: String!, pipelinekeys: [String]!, maintopics: [String]!, conjunctivetopics: [String], bbox: [Float]!, zoomLevel: Int!, bbox: [Float]!, externalsourceid: String!): FeatureTimeSeriesCollection
    topLocations(maintopic: String!, limit: Int, fromDate: String!, periodType: String!, toDate: String!, pipelinekeys: [String]!, conjunctivetopics: [String]!, bbox: [Float]!, externalsourceid: String!): TopPlacesCollection
    topSources(maintopic: String!, limit: Int, fromDate: String!, periodType: String!, toDate: String!, pipelinekeys: [String]!, conjunctivetopics: [String]!, bbox: [Float]!, zoomLevel: Int!): TopSourcesCollection
    topTerms(limit: Int, fromDate: String!, periodType: String!, toDate: String!, pipelinekeys: [String]!, externalsourceid: String!, bbox: [Float]!, zoomLevel: Int!): TopTermsCollection
  }

  type Term {
    name: String!
    mentions: Int
    avgsentiment: Float
  }

  type Place {
    name: String!
    placeid: String
    layer: String
    mentions: Int
    avgsentiment: Float
    coordinates: [Float]
  }

  type ExternalSource {
    name: String!
    pipelinekey: String
    mentions: Int
    avgsentiment: Float
  }

  type TopSourcesCollection{
    runTime: String,
    edges: [ExternalSource]!
  }

  type TopPlacesCollection{
    runTime: String,
    edges: [Place]!
  }

  type TopTermsCollection{
    runTime: String,
    edges: [Term]!
  }

  type ConjuntiveTerm {
    name: String!
    conjunctionterm: String!
    mentions: Int
    avgsentiment: Float
  }

  type ConjunctionTermCollection {
    runTime: String
    edges: [ConjuntiveTerm]!
  }

  type TimeSeriesLabel {
    name: String!
  }

  type FeatureTimeSeriesCollection {
    labels: [TimeSeriesLabel]!
    graphData: [TimeSeriesEntry]!
  }

  type TimeSeriesEntry{
    date: String!,
    name: String!
    avgsentiment: Float
    mentions: Int!
  }
`);