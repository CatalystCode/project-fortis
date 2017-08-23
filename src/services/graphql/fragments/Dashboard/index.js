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