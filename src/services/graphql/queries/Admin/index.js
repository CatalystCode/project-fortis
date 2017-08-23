export const getAdminSiteDefinition = `query Sites($siteId: String) {
    siteDefinition: sites(siteId: $siteId) {
        ...FortisSiteDefinitionView
    }
}`;

