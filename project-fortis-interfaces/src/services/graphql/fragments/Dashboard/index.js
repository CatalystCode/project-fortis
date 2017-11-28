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
                title,
                link
            }
            coordinates
        }
    }`;

export const topSourcesFragment = `fragment FortisTopSourcesView on TopSourcesCollection {
        edges {
            name, 
            pipelinekey,
            mentions,
            avgsentiment
        }
        csv {
            url
        }
    }`;

export const translatedWordsFragment = `fragment TranslatedWordsView on TranslatedWords {
  words {
    originalSentence
    translatedSentence
  }
}`;

export const translationEventFragment = `fragment TranslationView on TranslationResult{
    translatedSentence
}`;

export const termsFragment = ` fragment FortisPopularTermsView on TopTermsCollection {
        edges {
            name
            avgsentiment
            mentions
        }
        csv {
            url
        }
    }`;

export const popularPlacesFragment = ` fragment FortisPopularPlacesView on TopPlacesCollection {
        edges {
            name
            placeid
            layer
            bbox
            centroid
            mentions
            avgsentiment
        }
        csv {
            url
        }
    }`;

export const visualizationChartFragment = `fragment FortisDashboardTimeSeriesView on FeatureTimeSeriesCollection {
        labels {
            name
        }
        graphData {
            name
            mentions
            avgsentiment
            date
        }
        tiles
        csv {
            url
        }
    }`;

export const conjunctiveTermsFragment = `fragment FortisDashboardConjunctiveTermsView on ConjunctionTermCollection {
        edges {
            name
            mentions
            conjunctionterm
        }
        csv {
            url
        }
    }`;

export const eventDetailsFragment = `fragment FortisDashboardView on Feature {
    coordinates
    properties {
        messageid,
        summary,
        edges,
        eventtime,
        sourceeventid,
        places,
        externalsourceid,
        sentiment,
        language,
        pipelinekey,
        link,
        title,
        body,
        link
    }
}`;

export const heatmapFragment = `fragment FortisHeatmapViewFeatures on FeatureCollection {
    features {
        coordinates
        properties {
            mentions
            date
            avgsentiment
            tile {
                id
                row
                column
            }
        }
    }
 }`;
