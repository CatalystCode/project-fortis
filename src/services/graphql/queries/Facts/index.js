export const FactsQuery = `
query FetchFacts($pipelinekeys: [String]!, $mainTerm: String!, $fromDate: String!, $toDate: String!) {
  facts: byPipeline(pipelinekeys: $pipelinekeys, mainTerm: $mainTerm, fromDate: $fromDate, toDate: $toDate) {
    ...FortisFactsView
  }
}
`.trim();