var graphql = require('graphql');

module.exports = graphql.buildSchema(`
  type Query {
    popularLocations(site: String!, langCode: String, limit: Int, timespan: String!,
                     zoomLevel: Int, layertype: String, sourceFilter: [String], fromDate: String, toDate: String): FeatureCollection
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

  type Feature {
    type: FeatureType,
    coordinates: [Float],
    properties: LocationProps!
  }

  type LocationProps {
    location: String,
    population: Float,
    mentions: Int
  }
`);