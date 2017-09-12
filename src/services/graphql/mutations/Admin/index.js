export const editSite = `mutation EditSite($input: EditableSiteSettings!) {
  editSite(input: $input) {
    name
  }
}`;