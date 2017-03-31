var graphql = require('graphql');
 
module.exports = graphql.buildSchema(`
  interface Edge {
    name: String!
    type: EdgeType
    RowKey: String
  }

  interface EdgeProperties {
    name: String!
    mentions: Int
  }

  enum EdgeType {
    Location
    Term
  } 

  type Location implements Edge{
    name: String!
    RowKey: String
    originalsource: String,
    coordinates: [Float]
    name_ar: String
    name_ur: String
    name_id: String
    alternatenames: String
    country_iso: String
    aciiname: String
    region: String
    population: Float
    type: EdgeType
  }

  type Term implements Edge {
    name: String!
    type: EdgeType
    name_ar: String
    name_ur: String
    name_id: String
    demographic: String
    RowKey: String
  }

  input TermEdit{
    name: String!
    type: EdgeType
    name_ar: String
    name_ur: String
    name_id: String
    demographic: String
    RowKey: String
  }

  input LocationEdit{
    name: String
    type: EdgeType
    alternatenames: String
    originalsource: String
    country_iso: String
    coordinates: [Float]
    region: String
    name_ar: String
    name_ur: String
    name_id: String
    aciiname: String
    population: Float
    RowKey: String
  }

  type TopSourcesCollection{
    sources: [TopSource]!
  }

  type TopSource{
    Name: String,
    Count: Int,
    Source: String
  }

  type TermCollection {
    runTime: String
    edges: [Term]!
  }

  type LocationCollection {
    runTime: String
    edges: [Location]!
  }

  input EdgeTerms {
    edges: [TermEdit]!
    site: String!
  }

  input EdgeLocations {
    edges: [LocationEdit]!
    targetBBox: [Float]
    site: String!
  }

  type TopNLocationCollection {
    runTime: String,
    edges: [PopularLocationEdgeProperties]!
  }

  type TopNTermCollection {
    runTime: String,
    edges: [PopularTermEdgeProperties]!
  }

  type PopularLocationEdgeProperties implements EdgeProperties {
    name: String!
    mentions: Int
    coordinates: [Float]
    population: Float
  }

  type PopularTermEdgeProperties implements EdgeProperties {
    name: String!
    mentions: Int
  }

  type EdgeTimeSeriesCollection {
    labels: [PopularTermEdgeProperties]!
    graphData: [EdgeTimeSeriesEntry]!
  }

  type EdgeTimeSeriesEntry{
    date: String!,
    edges: [String]!
    mentions: [Int]!
  }

  type Query {
    locations(site: String!, query: String): LocationCollection
    terms(site: String!, query: String, fromDate: String, toDate: String, sourceFilter: [String]): TermCollection
    popularLocations(site: String!, langCode: String, limit: Int, timespan: String!, 
                     zoomLevel: Int, layertype: String, sourceFilter: [String], fromDate: String, toDate: String): TopNLocationCollection
    timeSeries(site: String!, fromDate: String!, toDate: String!, zoomLevel: Int, limit: Int, layertype: String, sourceFilter: [String], mainEdge: String): EdgeTimeSeriesCollection
    topSources(site: String!, fromDate: String!, toDate: String!, limit: Int!, mainTerm: String, sourceFilter: [String]): TopSourcesCollection
  }

  type Mutation {
    removeKeywords(input: EdgeTerms): TermCollection
    addKeywords(input: EdgeTerms): TermCollection
    removeLocations(input: EdgeLocations): LocationCollection
    saveLocations(input: EdgeLocations): LocationCollection
  }
`);