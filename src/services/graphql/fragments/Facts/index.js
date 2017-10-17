export const factsFragment = `
fragment FortisFactsView on FeatureCollection {
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
}
`.trim();