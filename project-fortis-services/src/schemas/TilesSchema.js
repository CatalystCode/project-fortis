const graphql = require('graphql');

module.exports = graphql.buildSchema(`
  type Query {
    heatmapFeaturesByTile(fromDate: String!, toDate: String!, periodType: String!, pipelinekeys: [String]!, maintopic: String!, conjunctivetopics: [String], tileid: String!, zoomLevel: Int!, bbox: [Float], externalsourceid: String!): FeatureCollection,
    fetchTileIdsByPlaceId(placeid: String!, zoomLevel: Int!): [TileId],
  }

  enum TypeEnum {
    FeatureCollection
  }

  enum FeatureType {
    Point
  }

  type FeatureCollection {
    runTime: String,
    type: TypeEnum!,
    features: [Feature]!
  }

  type TileId {
    id: String
    zoom: Int
    row: Int
    column: Int
  }

  type Feature {
    type: FeatureType,
    coordinates: [Float],
    properties: Tile!
  }

  type Tile {
    mentions: Int
    date: String
    avgsentiment: Float
    tile: TileId
  }
`);