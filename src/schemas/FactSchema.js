var graphql = require('graphql');

module.exports = graphql.buildSchema(`
  type Query {
    list(pageSize: Int, skip: Int, tagFilter: [String]): FactCollection,
    get(id: String!): Fact
  }

  enum TypeEnum {
    FactCollection
  }

  type FactCollection {
    runTime: String,
    type: TypeEnum!,
    facts: [Fact]!,
  }

  type Fact {
    id: ID,
    language: String,
    title: String,
    tags: [String],
    date: String,
    link: String,
    text: String,
    sources: [String]
  }
`);
