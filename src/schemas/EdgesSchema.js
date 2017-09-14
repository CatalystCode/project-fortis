const graphql = require('graphql');

module.exports = graphql.buildSchema(`
  type Query {
    geofenceplaces(bbox: [Float]!, csv: Boolean): GeofencePlacesCollection
    conjunctiveTerms(maintopic: String!, fromDate: String!, periodType: String!, toDate: String!, pipelinekeys: [String]!, bbox: [Float]!, zoomLevel: Int!, externalsourceid: String!, csv: Boolean): ConjunctionTermCollection
    timeSeries(maintopics: [String]!, fromDate: String!, toDate: String!, periodType: String!, pipelinekeys: [String]!, maintopics: [String]!, conjunctivetopics: [String], bbox: [Float]!, zoomLevel: Int!, externalsourceid: String!, csv: Boolean): FeatureTimeSeriesCollection
    topLocations(maintopic: String!, limit: Int, fromDate: String!, periodType: String!, toDate: String!, pipelinekeys: [String]!, conjunctivetopics: [String]!, bbox: [Float]!, zoomLevel: Int!, externalsourceid: String!, csv: Boolean): TopPlacesCollection
    topSources(maintopic: String!, limit: Int, fromDate: String!, periodType: String!, toDate: String!, pipelinekeys: [String]!, conjunctivetopics: [String]!, bbox: [Float]!, zoomLevel: Int!, csv: Boolean): TopSourcesCollection
    topTerms(limit: Int, fromDate: String!, periodType: String!, toDate: String!, pipelinekeys: [String]!, externalsourceid: String!, bbox: [Float]!, zoomLevel: Int, csv: Boolean): TopTermsCollection
  }

  type Csv {
    url: String!
    expires: String!
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
    bbox: [Float]
    centroid: [Float]
  }

  type OsmPlace{
    layer: String
    name: String
    placeid: String
    bbox: [Float]
    centroid: [Float]
  }

  type ExternalSource {
    name: String!
    pipelinekey: String
    mentions: Int
    avgsentiment: Float
  }

  type GeofencePlacesCollection {
    places: [OsmPlace]!
    csv: Csv
  }

  type TopSourcesCollection{
    runTime: String,
    edges: [ExternalSource]!
    csv: Csv
  }

  type TopPlacesCollection{
    runTime: String,
    edges: [Place]!
    csv: Csv
  }

  type TopTermsCollection{
    runTime: String,
    edges: [Term]!
    csv: Csv
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
    csv: Csv
  }

  type TimeSeriesLabel {
    name: String!
  }

  type FeatureTimeSeriesCollection {
    labels: [TimeSeriesLabel]!
    graphData: [TimeSeriesEntry]!
    tiles: [String]
    csv: Csv
  }

  type TimeSeriesEntry{
    date: String!
    name: String!
    avgsentiment: Float
    mentions: Int!
  }
`);