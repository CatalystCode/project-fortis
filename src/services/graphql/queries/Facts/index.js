export const FactsQuery = `
query FetchFacts($pipelinekeys: [String]!) {
  facts: byPipeline(pipelinekeys: $pipelinekeys) {
    ...FortisFactsView
  }
}
`.trim();