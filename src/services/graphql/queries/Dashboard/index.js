export const getMessagesByBbox = `query ByBbox($externalsourceid: String, $bbox: [Float]!, $conjunctivetopics: [String]!, $limit: Int!, $pageState: String, $fromDate: String!, $toDate: String!, $pipelinekeys: [String]!, $fulltextTerm: String) {
byBbox(externalsourceid: $externalsourceid, bbox: $bbox, conjunctivetopics: $conjunctivetopics, limit: $limit, pageState: $pageState, fromDate: $fromDate, toDate: $toDate, pipelinekeys: $pipelinekeys, fulltextTerm: $fulltextTerm) {
...FortisDashboardView
}
}`;

export const getTopSourcesQuery = `query TopSources($maintopic: String!, $bbox: [Float]!, $zoomLevel: Int!, $conjunctivetopics: [String]!, $limit: Int!, $fromDate: String!, $toDate: String!, $topsourcespipelinekey: [String]!, $periodType: String!) {
    ${getTopSources}
}`;

export const getTopSources = `topSources(maintopic:$maintopic, bbox: $bbox, conjunctivetopics: $conjunctivetopics, limit: $limit, fromDate: $fromDate, toDate: $toDate, pipelinekeys: $topsourcespipelinekey, zoomLevel:$zoomLevel, periodType: $periodType) {
    ... FortisTopSourcesView
}`;

export const getPopularTermsQuery = `query PopularTerms($bbox: [Float]!, $zoomLevel: Int!, $limit: Int!, $fromDate: String!, $toDate: String!, $pipelinekeys: [String]!, $periodType: String!, $externalsourceid: String!) {
    ${getPopularTerms}
}`;

export const getPopularTerms = `topTerms(bbox: $bbox, limit: $limit, fromDate: $fromDate, toDate: $toDate, pipelinekeys: $pipelinekeys, zoomLevel:$zoomLevel, periodType: $periodType, externalsourceid: $externalsourceid) {
... FortisPopularTermsView
}`;

export const getPopularPlacesQuery = `query PopularPlaces($maintopic: String!, $bbox: [Float]!, $zoomLevel: Int!, $limit: Int!, $fromDate: String!, $toDate: String!, $pipelinekeys: [String]!, $periodType: String!, $externalsourceid: String!, $conjunctivetopics: [String]!) {
    ${getPopularPlaces}
}`;

export const getPopularPlaces = `topLocations(maintopic:$maintopic, bbox: $bbox, limit: $limit, fromDate: $fromDate, toDate: $toDate, pipelinekeys: $pipelinekeys, conjunctivetopics:$conjunctivetopics, periodType: $periodType, externalsourceid: $externalsourceid) {
... FortisPopularPlacesView
}`;

export const getTimeSeries = `timeSeries(maintopics:$timeseriesmaintopics, pipelinekeys: $pipelinekeys, fromDate: $fromDate, toDate: $toDate, periodType: $timePeriodType, bbox: $bbox, zoomLevel: $zoomLevel, externalsourceid: $externalsourceid, conjunctivetopics: $conjunctivetopics){
    ...FortisDashboardTimeSeriesView
}`;

export const getConjunctiveTerms = `conjunctiveTerms(maintopic:$maintopic, bbox: $bbox, fromDate: $fromDate, toDate: $toDate, pipelinekeys: $pipelinekeys, zoomLevel:$zoomLevel, periodType: $periodType, externalsourceid: $externalsourceid) {
    ... FortisDashboardConjunctiveTermsView
}`;

export const PopularEdgesQuery = selectedTerm => 
    `query PopularEdges($bbox: [Float]!, $zoomLevel: Int!, $limit: Int!, $fromDate: String!, $toDate: String!, 
                        $pipelinekeys: [String]!, $timePeriodType: String!, $periodType: String!, $externalsourceid: String!, 
                        $maintopic: String!, $timeseriesmaintopics: [String]!, $conjunctivetopics: [String]!, $topsourcespipelinekey: [String]!) {
        timeSeries:${getTimeSeries},
        topics: ${getPopularTerms},
        locations: ${getPopularPlaces}
        ${selectedTerm ? `, sources: ${getTopSources},
                            conjunctiveterms: ${getConjunctiveTerms}`: ``}
    }`;