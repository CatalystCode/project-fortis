export const getMessagesByBbox = `fragment FortisDashboardView on FeatureCollection {
        pageState
        features {
            properties {
                messageid,
                summary,
                edges,
                eventtime,
                sourceeventid,
                externalsourceid,
                sentiment,
                language,
                pipelinekey,
                link,
                originalSource,
                title,
                link
            }
        }
    }`;

export const topSourcesFragment = `fragment FortisTopSourcesView on TopSourcesCollection {
        edges {
            name, 
            pipelinekey,
            mentions,
            avgsentiment
        }
    }`;

export const termsFragment = ` fragment FortisPopularTermsView on TopTermsCollection {
        runTime
        edges {
            name
            avgsentiment
            mentions
        }
    }`;

export const popularPlacesFragment = ` fragment FortisPopularPlacesView on TopPlacesCollection {
        runTime
        edges {
            name
            placeid
            coordinates
            layer
            mentions
        }
    }`;

export const visualizationChartFragment = `fragment FortisDashboardTimeSeriesView on FeatureTimeSeriesCollection {
        labels {
            name
        }
        graphData {
            name
            mentions
            date
        }
    }`;

export const conjunctiveTermsFragment = `fragment FortisDashboardConjunctiveTermsView on ConjunctionTermCollection {
        edges {
            name
            mentions
            conjunctionterm
        }
    }`;