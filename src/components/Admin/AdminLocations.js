import React from 'react';
import Fluxxor from 'fluxxor';
import {DataGrid} from './DataGrid';
import turfInside from 'turf-inside';
import numeralLibs from 'numeral';
import turfBbox from 'turf-bbox-polygon';
import L from 'leaflet';
import 'leaflet-draw'
import 'leaflet-geocoder-mapzen';
import 'leaflet-geocoder-mapzen/dist/leaflet-geocoder-mapzen.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet/dist/images/layers-2x.png';
import 'leaflet/dist/images/layers.png';
import 'leaflet/dist/images/marker-icon-2x.png';
import 'leaflet/dist/images/marker-icon.png';
import '../../styles/Admin/Admin.css'
import 'leaflet.markercluster/dist/leaflet.markercluster-src';
import 'leaflet.markercluster.layersupport/dist/leaflet.markercluster.layersupport-src';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const DEFAULT_BBOX = [14.5458984375,30.486550842588485,16.259765625000004,31.765537409484374];
const FluxMixin = Fluxxor.FluxMixin(React),
    StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

const styles = {
    settings: {
            input: {
                width: '95%',
                marginLeft: '4px',
                fontSize: '12px'
            },
            row: {
                display:'inline-flex',
                alignItems: 'center',
                width: '100%'
            },
            mapColumn: {
                marginLeft: '13px'
            },
            label: {
                display: 'inline-table'
            },
            locationGridColumn: {
                marginTop: '14px',
                marginLeft: '10px',
                width: '63%'
            }
    }
};

export const AdminLocations = React.createClass({
    mixins: [FluxMixin, StoreWatchMixin],
    getInitialState(){
        return {
            targetBbox: [],
            localAction: false,
            locationsAdded: [],
            rowsToRemove: []
        }
    },
    addLayerSupportGroup(){
      if(this.map){
            this.clusterControl = L.control.layers(null, null, { collapsed: false, position: 'bottomright' });
            const options = { chunkedLoading: true };
            this.mcgLayerSupportGroup = L.markerClusterGroup.layerSupport(options);
            this.mcgLayerSupportGroup.addTo(this.map);
            this.activeFeaturesGroup = false;
            this.layerGroups = [];
            this.map.on('overlayadd', cluster => this.addNewClusterLayersToGrid(cluster.layer.getLayers()));
            this.map.on('overlayremove', cluster => this.removeClusterLayersFromGrid(cluster.layer.getLayers()));
            this.clusterControl.addTo(this.map);
      }
    },
    reloadOsmPlaces(targetBbox){
        if(this.layerGroups){
            this.clearClusters();
        }

        this.getFlux().actions.ADMIN.load_places_inside_bbox(this.props.siteKey, targetBbox);
    },
    componentDidMount(){
        if(!this.map){
            this.bindLeafletMap(this.props.rows);
        }
    },
    clearClusters(){
        //check out the layers from the support group
        this.mcgLayerSupportGroup.checkOut(this.layerGroups.concat([this.activeFeaturesGroup]));
        //remove the layers from each of overlay of the control
        this.layerGroups.forEach(layer=>{
            this.clusterControl.removeLayer(layer);
        });

        //now clear the layers collection
        this.layerGroups = [];
        this.activeFeaturesGroup = false;
    },
    addFeatureClusterGroupWithDupeFilter(features, overlayGroup){
        const filteredFeatures = features.filter(feature=>!this.duplicateLocation(feature.properties.name));

        if(filteredFeatures.length > 0){
            return this.addFeatureClusterGroup(filteredFeatures, overlayGroup);
        }else{
            return undefined;
        }
    },
    addFeatureClusterGroup(features, overlayGroup){
        let layerGroup = overlayGroup || L.layerGroup();
        features.forEach(feature=>{
                const geoJsonFeature = L.geoJson(feature, {
                                            onEachFeature: (feature, layer) => {
                                                const populationStr = (feature.properties.population||0) > 0 ? ` - population ${numeralLibs(feature.properties.population||0).format(feature.properties.population||0 > 1000 ? '0.0a' : '0a')}` : '';
                                                const title = `</i>${feature.properties.name}<i>${populationStr}</i>`;
                                                                    
                                                layer.options.icon = new L.DivIcon({html: `<div class="leaflet-marker-iconlabel"><i class="fa fa-map-marker fa-2x" style="color: #2f4074">${title}</div>`});
                                             }
                                      });
                                        
                geoJsonFeature.addTo(layerGroup);
        });

        return layerGroup;
    },
    transformEdgeToGeoJsonFeature(edges){
        return edges.map(feature=>Object.assign({}, {"type": "Feature"}, {geometry: { "type": "Point", "coordinates": feature.coordinates.split(",").map(point=>parseFloat(point)) } }, {properties: {name: feature.name, population: feature.population}}));
    },
    addOsmPlacesClusters(){
        let state = this.getStateFromFlux();
        let layerGroupMap = new Map();

        for(let [placeType, features] of state.osmPlaceGroups.entries()){
            const layerGroup = this.addFeatureClusterGroupWithDupeFilter(features);
            if(layerGroup){
                layerGroupMap.set(placeType, layerGroup);
            }
        }

        this.layerGroups = Array.from(layerGroupMap.values());
        
        for(let [placeType, group] of layerGroupMap.entries()){
            this.clusterControl.addOverlay(group, placeType);
        }
    },
    refreshMapClusters(){
        if(this.mcgLayerSupportGroup){
            //add the OSM place overlay groups to both the map and control
            this.addOsmPlacesClusters();
            //Transform the location list to a valid geojson structure
            let activeFeatures = this.transformEdgeToGeoJsonFeature(this.props.rows.filter(location=>this.coordinateInsidePolygon(location.coordinates.split(",").map(point=>parseFloat(point)), turfBbox(this.state.targetBbox))));
            //Transform the geojson feature list to a layer group
            this.activeFeaturesGroup = this.addFeatureClusterGroup(activeFeatures);
            this.mcgLayerSupportGroup.checkIn(this.layerGroups.concat([this.activeFeaturesGroup]));
            //add the layer group to the map
            this.activeFeaturesGroup.addTo(this.map);
        }
    },
    bindEditControl(bbox){
        this.drawnItems = L.featureGroup();
        this.drawnItems.addTo(this.map);
        const drawOptions = {
            edit: {
                featureGroup: this.drawnItems,
                remove: false,
                edit: false
            },
            draw: {
                polygon: false,
                rectangle: {
                    title : 'Select the geo fence area.',
                    repeatMode: false
                },
                marker: false,
                circle: false,
                polyline: false
            }};

        this.map.addControl(new L.Control.Draw(drawOptions));
        this.map.on(L.Draw.Event.CREATED, event => {
           const bounds = event.layer.getBounds();

           if(bounds.getNorthWest().toLocaleString() !== bounds.getSouthEast().toLocaleString()){
               this.drawBBox(bounds.toBBoxString().split(",").map(coord=>parseFloat(coord)))
           }
        });
        this.drawBBox(bbox);
    },
    bindLeafletMap(locations){
        const bbox = this.state.settings.properties.targetBbox && this.state.settings.properties.targetBbox.length > 0 ? this.state.settings.properties.targetBbox : DEFAULT_BBOX;
        const bounds = [[bbox[1], bbox[0]], [bbox[3], bbox[2]]];
        L.Icon.Default.imagePath = "https://unpkg.com/leaflet@1.0.2/dist/images/";
        this.map = L.map('map', {zoomControl: false});
        this.map.fitBounds(bounds);
        this.map.addControl(L.control.zoom({position: 'bottomleft'}));
        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            id: 'mapbox.dark',
            accessToken: 'pk.eyJ1IjoiZXJpa3NjaGxlZ2VsIiwiYSI6ImNpaHAyeTZpNjAxYzd0c200dWp4NHA2d3AifQ.5bnQcI_rqBNH0rBO0pT2yg'
        }).addTo(this.map);
        L.tileLayer('http://korona.geog.uni-heidelberg.de/tiles/adminb/x={x}&y={y}&z={z}').addTo(this.map);
        this.bindEditControl(bbox);
        this.addLayerSupportGroup();
    },
    removeClusterLayersFromGrid(layersCollection){
        if(layersCollection && layersCollection.length > 0){
            const localAction = 'changed';
            const locationsAdded = [];
            const rowsToRemove = layersCollection.map(layers => layers.getLayers()[0].feature.properties.name);
            this.setState({rowsToRemove, localAction, locationsAdded});
        }
    },
    addNewClusterLayersToGrid(layersCollection){
        let self = this;
        const localAction = 'changed';

        if(layersCollection && layersCollection.length > 0){
            const newFeatureRows = layersCollection.filter(layers=>layers.getLayers() && layers.getLayers().length === 1 && layers.getLayers()[0].feature && !self.duplicateLocation(layers.getLayers()[0].feature.properties.name))
                                                   .map(layers=> {
                                                         const geoJsonFeature = layers.getLayers()[0].feature;
                                                         
                                                         return {
                                                            name: geoJsonFeature.properties.name,
                                                            name_ar: geoJsonFeature.properties.name_ar,
                                                            name_de: geoJsonFeature.properties.name_de,
                                                            name_ur: geoJsonFeature.properties.name_ur,
                                                            name_id: geoJsonFeature.properties.name_id,
                                                            originalsource: geoJsonFeature.properties.originalsource,
                                                            population: geoJsonFeature.properties.population || 0,
                                                            coordinates: geoJsonFeature.geometry.coordinates.join(","),
                                                            RowKey: geoJsonFeature.properties.RowKey,
                                                            region: geoJsonFeature.properties.region || "",
                                                            country_iso: geoJsonFeature.properties.country_a || ""
                                                        };
                                                     });

           this.setState({locationsAdded: newFeatureRows, localAction: localAction, rowsToRemove: []});
        }
    },
    duplicateLocation(locationName){
        let selectedLocations = this.getStateFromFlux().locations;
        return selectedLocations.has(locationName.toLowerCase());
    },
    addGeocoder(bbox){
        if(this.map && bbox && bbox.length === 4){
          if(this.geocoder){
              this.geocoder.remove();
          }

          let self = this;
           const options = {
               bounds: L.latLngBounds(L.latLng(bbox[1], bbox[0]),  L.latLng(bbox[3], bbox[2])),
               position: 'topright',
               sources: 'gn',
               layers: 'coarse'
            };

            const geocoder = L.control.geocoder(this.state.settings.properties.mapzenApiKey, options);
            geocoder.on('select', e => {
               let locationsAdded = [];
               const localAction = 'changed';
               const selectedLocation = {
                   name: e.feature.properties.name,
                   name_ar: "",
                   name_id: "",
                   name_ur: "",
                   name_de: "",
                   population: e.feature.properties.population || 0,
                   originalsource: e.feature.properties.source,
                   coordinates: e.feature.geometry.coordinates.join(","),
                   RowKey: e.feature.properties.id,
                   region: e.feature.properties.region || "",
                   country_iso: e.feature.properties.country_a || ""
               };

               if(!self.duplicateLocation(selectedLocation.name)){
                   this.addFeatureClusterGroup(this.transformEdgeToGeoJsonFeature([selectedLocation]), this.activeFeaturesGroup);
                   locationsAdded.unshift(selectedLocation);
                   geocoder.reset();
                   self.setState({locationsAdded, localAction});
               }else{
                   alert(`${selectedLocation.name} is already being monitored.`);
               }
            });

            geocoder.addTo(this.map);
            this.geocoder = geocoder;
        }
    },
    setView(latitude, longitude, zoom){
        this.map.setView([latitude, longitude], zoom);
    },
    coordinateInsidePolygon(coordinates, bboxPolygon){
        const pointGeoJsonBase = {
            "type": "Feature",
            "geometry": {
                   "type": "Point"
            }
        };

        return turfInside( Object.assign({}, pointGeoJsonBase, { geometry: {
                                                                type: "Point",
                                                                coordinates: coordinates }
                                                        }), bboxPolygon);
    },
    locationsOutsideofBbox(bbox){
        const locations = this.props.rows.concat(this.state.locationsAdded);
        return locations.filter(location=>!this.coordinateInsidePolygon(location.coordinates.split(",").map(point=>parseFloat(point)), turfBbox(bbox)))
                        .map(location=>location.name);
    },
    drawBBox(bbox){
        let selectedRowKeys;
        
        if(this.bbox) {
            this.drawnItems.clearLayers();
            selectedRowKeys = this.locationsOutsideofBbox(bbox);
            this.bbox = null;
        }

        if(bbox && bbox.length === 4){
            const bounds = [[bbox[1], bbox[0]], [bbox[3], bbox[2]]];
            // create a teal rectangle
            this.bbox = L.rectangle(bounds, {weight: 2, color: '#0ff', fillOpacity: 0, clickable: false});
            // zoom the map to the rectangle bounds
            this.map.fitBounds(bounds);
            this.drawnItems.addLayer(this.bbox);
            this.addGeocoder(bbox);
            this.setState({targetBbox: bbox, selectedRowKeys: selectedRowKeys});
            this.reloadOsmPlaces(bbox);
        }
    },
    getStateFromFlux() {
        return this.getFlux().store("AdminStore").getState();
    },
    mutatedSiteSettingsDefinition(targetBbox){
        const {defaultLocation, defaultZoomLevel, storageConnectionString, title, logo, fbToken, featuresConnectionString, supportedLanguages, mapzenApiKey} = this.state.settings.properties;
        const {name} = this.state.settings;
        const languageJSON = `["${supportedLanguages.join('","')}"]`;
        const siteDefintion = Object.assign({}, {
                               name: name, 
                               targetBbox: targetBbox, 
                               logo:logo, 
                               defaultLocation:defaultLocation, 
                               defaultZoomLevel:defaultZoomLevel, 
                               supportedLanguages: JSON.parse(languageJSON), 
                               title:title, 
                               featuresConnectionString:featuresConnectionString, 
                               storageConnectionString:storageConnectionString, 
                               fbToken:fbToken,
                               mapzenApiKey: mapzenApiKey
        });

        return siteDefintion;
    },
    handleLocationsSave(mutatedRows, columns){
        const reducedRows = mutatedRows.map(location=>Object.assign({}, location, {coordinates: location.coordinates && location.coordinates.length > 0 ? location.coordinates.split(",").map(point=>parseFloat(point)) : []}));
        this.clearClusters();

        this.setState({locationsAdded: []});
        this.getFlux().actions.ADMIN.save_locations(this.props.siteKey, reducedRows, this.mutatedSiteSettingsDefinition(this.state.targetBbox));
    },
    handleRemove(deletedRows){
        const reducedRows = deletedRows.map(location=>Object.assign({}, {RowKey: location.RowKey}));
        this.clearClusters();
        this.getFlux().actions.ADMIN.remove_locations(this.props.siteKey, reducedRows);
    },
    render(){
        let state = this.getFlux().store("AdminStore").getState();
        const alternateLanguage = state.settings.properties.supportedLanguages.find(lang=>lang!=="en");
        const translatableFields = {sourceField: {language: "en", key: "name"}, targetField: {language: alternateLanguage, key: `name_${alternateLanguage}`}};
        //if the user saved new changes or layer groups have not been rendered
        if(this.layerGroups && this.layerGroups.length === 0 && this.state.osmPlaceGroups.size > 0 && !this.activeFeaturesGroup){
            this.refreshMapClusters();
        }

        if (!state.osmPlaceGroups.size === 0){
            return (
                <div className="loadingPage">
                    <p>Loading details&hellip;</p>
                </div>
            );
        }

        return (
         this.state.locationGridColumns.length > 0 ? 
                <div className="row">
                    <div className="col-lg-4" style={styles.settings.mapColumn}>
                        <div className="row" style={styles.settings.row}>
                            <label style={styles.settings.label}>Target Bbox</label>
                            <input readOnly value={this.state.targetBbox ? this.state.targetBbox.join(",") : "N/A"} type="text" style={styles.settings.input} className="form-control"/>
                        </div>
                        <div className="row">
                            <div id="map"></div>
                        </div>
                        <div className="row">
                            {
                                this.state.locationsAdded.length > 0 ? `Added ${this.state.locationsAdded.length} location(s) to watchlist.` : undefined
                            }
                        </div>
                    </div>
                    <div className="col-lg-7" style={styles.settings.locationGridColumn}>
                        <div className="row">
                            <DataGrid rowHeight={40}
                                minHeight={450}
                                rowKey="name"
                                handleSave={this.handleLocationsSave}
                                localAction={this.state.localAction}
                                handleRemove={this.handleRemove}
                                rowsToRemove={Array.from(this.state.rowsToRemove)}
                                rowAddDisabled={true}
                                translatableFields={translatableFields}
                                rowsToMerge={Array.from(this.state.locationsAdded)}
                                selectedRowKeys={this.state.selectedRowKeys ? Array.from(this.state.selectedRowKeys) : false}
                                columns={this.state.locationGridColumns}
                                rows={Array.from(state.locations.values())} />
                        </div>
                    </div>
                </div>
           : <div />
        );
    }
});