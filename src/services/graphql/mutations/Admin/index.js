export const editSite = `mutation EditSite($input: EditableSiteSettings!) {
  editSite(input: $input) {
    name
  }
}`;

export const saveStreams = `mutation SaveStreams($input: StreamListInput!) {
  modifyStreams(input: $input) {
    ...StreamsView
  }
}`;