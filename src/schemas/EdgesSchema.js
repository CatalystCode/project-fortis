const graphql = require('graphql');

module.exports = graphql.buildSchema(`
  type Query {
    conjunctiveterms(fromDate: String!, periodType: String!, toDate: String!, pipelinekeys: [String]!, mainTerm: String!, bbox: [Float], zoomLevel: Int, externalsourceid: String): TermCollection
    timeSeries(fromDate: String!, toDate: String!, pipelinekeys: [String]!, conjunctivetopics: [String]!, bbox: [Float], zoomLevel: Int, externalsourceid: String): FeatureTimeSeriesCollection
    topLocations(limit: Int!, fromDate: String!, periodType: String!, toDate: String!, pipelinekeys: [String]!, conjunctivetopics: [String]!, bbox: [Float], zoomLevel: Int, externalsourceid: String): TopPlacesCollection
    topSources(limit: Int!, fromDate: String!, periodType: String!, toDate: String!, pipelinekeys: [String]!, conjunctivetopics: [String]!, bbox: [Float], zoomLevel: Int, externalsourceid: String): TopSourcesCollection
    topTerms(limit: Int!, fromDate: String!, periodType: String!, toDate: String!, pipelinekeys: [String]!, conjunctivetopics: [String]!, bbox: [Float], zoomLevel: Int, externalsourceid: String): TopTermsCollection
  }

  type Term {
    name: String!
    mentions: Int
    avgsentiment: Float
  }

  type Place {
    name: String!
    mentions: Int
    avgsentiment: Float
    population: Float
  }

  type ExternalSource {
    name: String!
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
    edges: [ExternalSource]!
  }

  type TermCollection {
    runTime: String
    edges: [Term]!
  }

  type FeatureProperties {
    name: String!
    mentions: Int
    avgsentiment: Float
  }

  type FeatureTimeSeriesCollection {
    labels: [FeatureProperties]!
    graphData: [TimeSeriesEntry]!
  }

  type TimeSeriesEntry{
    date: String!,
    edges: [String]!
    mentions: [Int]!
  }
`);