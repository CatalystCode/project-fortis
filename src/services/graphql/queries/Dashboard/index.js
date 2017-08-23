export const getMessagesByBbox = `query ByBbox($externalsourceid: String, $bbox: [Float]!, $conjunctivetopics: [String]!, $limit: Int!, $pageState: String, $fromDate: String!, $toDate: String!, $pipelinekeys: [String], $fulltextTerm: String) {
byBbox(externalsourceid: $externalsourceid, bbox: $bbox, conjunctivetopics: $conjunctivetopics, limit: $limit, pageState: $pageState, fromDate: $fromDate, toDate: $toDate, pipelinekeys: $pipelinekeys, fulltextTerm: $fulltextTerm) {
...FortisDashboardView
}
}`;