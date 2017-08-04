const graphql = require('graphql');

module.exports = graphql.buildSchema(`
  type Query {
    fetchTilesByBBox(site: String!, bbox: [Float]!, mainEdge: String!, filteredEdges: [String], timespan: String!, zoomLevel: Int, sourceFilter: [String], fromDate: String, toDate: String, originalSource: String): FeatureCollection,
    fetchPlacesByBBox(site: String!, bbox: [Float]!, zoom: Int): PlaceCollection,
    fetchTilesByLocations(site: String!, locations: [[Float]]!, filteredEdges: [String], timespan: String!, sourceFilter: [String], fromDate: String, toDate: String): FeatureCollection,
    fetchEdgesByLocations(site: String!, locations: [[Float]]!, timespan: String!, sourceFilter: [String], fromDate: String, toDate: String): EdgeCollection,
    fetchEdgesByBBox(site: String!, bbox: [Float]!, zoomLevel: Int, mainEdge: String!, timespan: String!, sourceFilter: [String], fromDate: String, toDate: String, originalSource: String): EdgeCollection
  }

  enum TypeEnum {
    FeatureCollection
  }

  enum FeatureType {
    Point,
    MultiPoint
  }

  type FeatureCollection {
    runTime: String,
    type: TypeEnum!,
    bbox: [Float],
    features: [Feature]!
  }

  type PlaceCollection {
    runTime: String,
    type: TypeEnum!,
    bbox: [Float],
    features: [PlaceFeature]!
  }

  type PlaceFeature {
    coordinates: [Float],
    name: String,
    name_ar: String,
    name_ur: String,
    name_de: String,
    name_id: String,
    id: String,
    population: Float,
    kind: String,
    tileId: ID,
    source: String
  }

  type EdgeCollection {
    runTime: String,
    edges: [Edge]!
  }

  type Feature {
    type: FeatureType,
    coordinates: [Float],
    properties: Tile!
  }

  enum EdgeType {
      Term,
      Location
  }

  type Edge {
    type: EdgeType,
    name: String,
    mentionCount: Int
  }

  type Tile {
    mentionCount: Int,
    location: String,
    population: Float,
    neg_sentiment: Float,
    pos_sentiment: Float,
    tileId: ID
  }
`);