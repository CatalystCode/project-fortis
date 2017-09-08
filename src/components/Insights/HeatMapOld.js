import Fluxxor from 'fluxxor';
import React from 'react';
import { Actions } from '../../actions/Dashboard';
import { SERVICES } from '../../services/Dashboard';
import weightedMean from '../../utils/WeightedMean';
import eachLimit from 'async/eachLimit';
import numeralLibs from 'numeral';
import L from 'leaflet';
import ProgressBar from 'react-progress-bar-plus';
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/images/layers-2x.png';
import 'leaflet/dist/images/layers.png';
import 'leaflet/dist/images/marker-icon-2x.png';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import '../../styles/Insights/HeatMap.css';
import 'react-progress-bar-plus/lib/progress-bar.css';

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("DataStore");

const PARELLEL_TILE_LAYER_RENDER_LIMIT = 200;
const SENTIMENT_FIELD = 'neg_sentiment';
const DEFAULT_CLUSTER_SIZE = 40;
const DEFAULT_LANGUAGE = 'en';

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZXJpa3NjaGxlZ2VsIiwiYSI6ImNpaHAyeTZpNjAxYzd0c200dWp4NHA2d3AifQ.5bnQcI_rqBNH0rBO0pT2yg';  // FIXME: should this really be checked in?
const TILE_LAYER_URL = 'https://api.mapbox.com/styles/v1/erikschlegel/cizn74i7700252rqk9tn70wu2/tiles/256/{z}/{x}/{y}?access_token={accessToken}';  // FIXME: should this be configurable?

export const HeatMap = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin],

  getInitialState() {
    return {
      mapProgressPercent: -1,
      intervalTime: 200,
      selectedTileId: false,
      modalTitle: ''
    };
  },

  getStateFromFlux() {
    return this.getFlux().store("DataStore").getState();
  },

  addInfoBoxControl() {
    if (!this.map) {
      return;
    }

    const self = this;
    const info = L.control();

    info.onAdd = map => {
      this._sentimentDiv = L.DomUtil.create('div', 'info');
      info.update();
      return this._sentimentDiv;
    };

    info.options = {
      position: 'topleft'
    };

    info.update = props => {
      const sentimentLevel = props && props.weightedSentiment ? props.weightedSentiment : 0;
      const { sentimentClass, sentimentIcon } = self.getSentimentClassAndIcon(sentimentLevel);
      const sentimentIconSpan = `<span class="material-icons sentimentIcon ${sentimentClass}Icon" color="#ffffff">${sentimentIcon}</span>`;
      const infoHeaderText = "<h5>Sentiment Summary</h5>";
      const infoBoxInnerHtml =
      `<div id="sentimentGraph">
        <div class="sentimentGraphBar ${sentimentClass}">
          ${self.formatSentimentLevel(sentimentLevel)} / 10
        </div>
        ${sentimentIconSpan}
      </div>`;

      this._sentimentDiv.innerHTML = infoHeaderText + infoBoxInnerHtml;
    };

    info.addTo(this.map);
    this.sentimentGraph = info;
  },

  addBreadCrumbControl() {
    if (!this.map) {
      return;
    }

    const state = this.getStateFromFlux();
    const info = L.control();

    info.onAdd = map => {
      this._div = L.DomUtil.create('div', 'info');
      return this._div;
    };

    info.options = {
      position: 'topleft'
    };

    info.update = filters => {
      const selectionType = state.categoryType;
      const selectedLanguage = state.language;
      const translations = state.allEdges.get(DEFAULT_LANGUAGE);
      const mainSearchEntity = state.mainEdge;
      const maxTerms = 3;
      const infoHeaderText = "<h5>Review your selection below</h5>";
      const infoBoxIntro = `
      <span class="filterLabelType">
        ${selectionType}:
      </span>
      <div class="filterLabelContainer">
        <span class="filterLabel">
          ${mainSearchEntity}
        </span>
      </div>`;

      let infoBoxInnerHtml = '';
      let numberOfDisplayedTerms = 0;

      if (filters.length > 0) {
        filters.forEach(filter => {
          if (++numberOfDisplayedTerms === maxTerms) {
            infoBoxInnerHtml += `<span class="filterLast">&nbsp;and ${(filters.length + 1) - maxTerms} Others</span>`;
          } else if (numberOfDisplayedTerms < maxTerms) {
            infoBoxInnerHtml += `
            ${numberOfDisplayedTerms > 0 ? '<span class="filterSeperation">+</span>' : ''}
            <div class="filterLabelContainer">
              <span class="filterLabel">
                ${translations.get(filter)[`name_${selectedLanguage}`]}
              </span>
            </div>`;
          }
        });
      }

      if (filters > 0) { // FIXME: isn't filters a list? if so: this would always return false
        infoBoxInnerHtml = `
        <span class="filterSeperation">+</span>
          <span class="filterLabelType">
            Term(s):
          </span>
          ${infoBoxInnerHtml}`;
      }

      this._div.innerHTML = infoHeaderText + infoBoxIntro + infoBoxInnerHtml;
    };

    info.addTo(this.map);
    this.breadCrumbControl = info;
  },

  getSentimentColor(sentiment) {
    return Actions.constants.SENTIMENT_COLOR_MAPPING[sentiment];
  },

  componentWillReceiveProps(nextProps) {
    const shouldUpdate =
      ((this.hasChanged(this.getStateFromFlux(), this, "bbox") && this.props.bbox.length > 0) ||
        this.hasChanged(nextProps, this.props, "datetimeSelection") ||
        this.props.height !== nextProps.height ||
        this.hasChanged(nextProps, this.props, "timespanType") ||
        this.hasChanged(nextProps, this.props, "edges") ||
        (!this.status && nextProps.mainEdge) ||
        this.hasChanged(nextProps, this.props, "language") ||
        this.hasChanged(nextProps, this.props, "mainEdge") ||
        this.hasChanged(nextProps, this.props, "dataSource")) &&
      this.status !== 'loading';

    if (!shouldUpdate) {
      return;
    }

    this.updateHeatmap();

    if (this.map) {
      this.map.invalidateSize()
    }
  },

  hasChanged(nextProps, currentProps, propertyName) {
    if (Array.isArray(nextProps[propertyName])) {
      return nextProps[propertyName].join(",") !== currentProps[propertyName].join(",");
    }

    if (currentProps[propertyName] && nextProps[propertyName] && nextProps[propertyName] !== currentProps[propertyName]) {
      return true;
    }

    return false;
  },

  getSentimentClassAndIcon(sentimentLevel) {
    let sentimentClass = "";
    let sentimentIcon = "";

    if (sentimentLevel < 30) {
      sentimentClass = "positiveSenitment";
      sentimentIcon = "sentiment_very_satisfied";
    } else if (sentimentLevel < 55) {
      sentimentClass = "neutralSentiment";
      sentimentIcon = "sentiment_neutral";
    } else if (sentimentLevel < 80) {
      sentimentClass = "neutralNegativeSentiment";
      sentimentIcon = "sentiment_dissatisfied";
    } else {
      sentimentClass = "negativeSenitment";
      sentimentIcon = "sentiment_very_dissatisfied";
    }

    return { sentimentClass, sentimentIcon };
  },

  getSentimentCategory(level) {
    if (level >= 0 && level < 30) {
      return "small";
    } else if (level >= 30 && level < 55) {
      return "medium";
    } else if (level >= 55 && level < 80) {
      return "large";
    } else {
      return "xl";
    }
  },

  formatSentimentLevel(sentimentLevel) {
    return parseFloat((sentimentLevel / 100) * 10).toFixed(2);
  },

  componentDidMount() {
    const state = this.getStateFromFlux();

    if (!state.settings.properties.defaultLocation || !state.settings.properties.defaultZoomLevel) {
      return;
    }

    const bbox = this.state.settings.properties.targetBbox;
    this.bbox = bbox;
    const bounds = [[bbox[1], bbox[0]], [bbox[3], bbox[2]]];
    this.tilemap = new Map();
    L.Icon.Default.imagePath = "https://unpkg.com/leaflet@1.0.2/dist/images/";
    this.map = L.map('leafletMap', {zoomControl: false});
    this.map.addControl(L.control.zoom({position: 'topright'}));
    this.map.fitBounds(bounds);
    const { lat, lng } = this.map.getCenter();
    this.map.coordinates = [lng, lat];

    L.tileLayer(TILE_LAYER_URL, {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 17,
      minZoom: 5,
      accessToken: MAPBOX_ACCESS_TOKEN
    }).addTo(this.map);

    this.map.selectedTerm = state.mainEdge;
    this.map.datetimeSelection = state.datetimeSelection;
    this.map.dataSource = state.dataSource;
    this.map.on('moveend', () => {
      this.getFlux().actions.DASHBOARD.updateAssociatedTerms(this.getStateFromFlux().associatedKeywords, this.getLeafletBbox(), this.getLeafletZoomLevel());
    });

    this.addClusterGroup();
    this.addInfoBoxControl();
    this.addBreadCrumbControl();
  },

  addClusterGroup() {
    if (!this.map) {
      return;
    }

    const self = this;

    this.markers = L.markerClusterGroup({
      maxClusterRadius: 120,
      chunkedLoading: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: cluster => {
        let maxSentimentLevel = 0;
        const totalMentions = cluster.getAllChildMarkers().reduce((prevTotal, child) => {
          maxSentimentLevel = Math.max(maxSentimentLevel, child.feature.properties[SENTIMENT_FIELD]);
          return child.feature.properties.mentionCount + prevTotal;
        }, 0);
        const cssClass = "marker-cluster marker-cluster-{0}".format(self.getSentimentCategory((maxSentimentLevel || 0) * 100));
        return self.customClusterIcon(totalMentions, cssClass);
      },
      singleMarkerMode: true
    });

    this.map.addLayer(this.markers);
  },

  customClusterIcon(mentions, cssClass) {
    let clusterSize = DEFAULT_CLUSTER_SIZE;

    if (mentions > 20 && mentions < 100) {
      clusterSize = 50;
      cssClass += " cluster-size-medium";
    } else if (mentions > 100 && mentions < 200) {
      clusterSize = 60;
      cssClass += " cluster-size-large";
    } else if (mentions > 200) {
      clusterSize = 70;
      cssClass += " cluster-size-xl";
    }

    return L.divIcon({
      html: "<div><span>{0}</span></div>".format(numeralLibs(mentions).format(mentions > 1000 ? '+0.0a' : '0a')),
      className: cssClass,
      iconSize: L.point(clusterSize, clusterSize)
    });
  },

  sortTerms(locationA, locationB) {
    if (locationB[1].mentions > locationA[1].mentions) {
      return 1;
    } else if (locationB[1].mentions < locationA[1].mentions) {
      return -1;
    }

    if (locationA[0] > locationB[0]) {
      return 1;
    } else if (locationA[0] < locationB[1]) {
      return -1;
    }

    return 0;
  },

  edgeSelected(name, type) {
    const state = this.getStateFromFlux();

    if (!state.associatedKeywords || !state.associatedKeywords.size || !name) {
      return false;
    }

    const edge = state.associatedKeywords.get(name);
    return !!(edge && edge.enabled);
  },

  updateDataStore(errors, bbox, filters, zoomLevel) {
    const aggregatedAssociatedTermMentions = new Map();
    const self = this;
    const weightedSentiment = weightedMean(this.weightedMeanValues) * 100;

    //bind the weigthed sentiment to the bullet chart data provider
    this.bbox = bbox;

    if (filters) {
      filters.forEach(edge => {
        const languageEdgeMap = self.state.allEdges.get(DEFAULT_LANGUAGE);
        const edgeFilterDictionary = languageEdgeMap.get(edge.name.toLowerCase());
        if (edgeFilterDictionary) {
          aggregatedAssociatedTermMentions.set(edge.name.toLowerCase(), {
            mentions: edge.mentionCount,
            enabled: self.edgeSelected(edge.name, edge.type),
            edgeFilterDictionary
          });
        }
      });
    }

    this.status = 'loaded';

    //sort the associated terms by mention count.
    const sortedEdgeMap = new Map([...aggregatedAssociatedTermMentions.entries()].sort(this.sortTerms));
    this.getFlux().actions.DASHBOARD.updateAssociatedTerms(sortedEdgeMap, bbox, zoomLevel);
    this.breadCrumbControl.update(Array.from(this.state.termFilters));
    this.sentimentGraph.update({weightedSentiment});
  },

  moveMapToNewLocation(location, zoom) {
    const originalLocation = this.map.coordinates;

    if (location && location.length > 0 && location[0] !== originalLocation[0] && location[1] !== originalLocation[1]) {
      this.map.setView([location[1], location[0]], zoom);
      this.map.coordinates = [location[0], location[1]];
    }
  },

  getLeafletBbox(){
    if (!this.map) {
      return undefined;
    }

    const bounds = this.map.getBounds();
    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();

    return [southWest.lng, southWest.lat, northEast.lng, northEast.lat];
  },

  getLeafletZoomLevel() {
    if (!this.map) {
      return undefined;
    }

    return this.map.getZoom();
  },

  updateHeatmap() {
    const state = this.getStateFromFlux();

    this.clearMap();
    this.status = "loading";
    const siteKey = this.props.siteKey;
    this.moveMapToNewLocation(state.selectedLocationCoordinates, this.map.getZoom());
    const zoom = this.map.getZoom();
    const bbox = this.getLeafletBbox();
    const self = this;
    this.weightedMeanValues = [];

    if (state.mainEdge) {
      SERVICES.getHeatmapTiles(siteKey, state.timespanType, zoom, state.categoryValue.name, state.datetimeSelection,
                               bbox, Array.from(state.termFilters), [state.selectedLocationCoordinates], Actions.DataSources(state.dataSource),
                               state.originalSource, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          self.createLayers(body, bbox, zoom)
        } else {
          this.status = 'failed';
          console.error(`[${error}] occured while processing tile request [${state.mainEdge}, ${state.datetimeSelection}, ${bbox}]`);
        }
      });
    }
  },

  createLayers(response, bbox, zoomLevel) {
    const self = this;

    if (!response || !response.data) {
      return;
    }

    const { features, edges } = response.data;
    if (!features || !edges) {
      self.updateDataStore('Invalid GraphQL Service response', bbox, undefined, zoomLevel);
      return;
    }

    eachLimit(features.features, PARELLEL_TILE_LAYER_RENDER_LIMIT, (tileFeature, cb) => {
      self.processMapCluster(tileFeature, cb);
    }, errors => self.updateDataStore(errors, bbox, edges.edges || [], zoomLevel));
  },

  processMapCluster(tileFeature, callback) {
    const tileId = tileFeature.properties.tileId || "N/A";
    let cachedTileMarker = this.tilemap.get(tileId);

    if (!cachedTileMarker && tileFeature.properties.tileId) {
      cachedTileMarker = this.addTileFeatureToMap(tileFeature);
    }

    this.weightedMeanValues.push([tileFeature.properties[SENTIMENT_FIELD], tileFeature.properties.mentionCount]);

    callback();
  },

  addTileFeatureToMap(tileFeature) {
    try {
      const mapMarker = this.featureToLeafletMarker(tileFeature);
      this.tilemap.set(tileFeature.properties.tileId, mapMarker);

      const heatMapLayer = L.geoJson(mapMarker, {});
      this.markers.addLayer(heatMapLayer);

      return heatMapLayer;
    } catch(e) {
      console.error(`An error occured trying to grab the tile details. [${e}]`);
    }
  },

  featureToLeafletMarker(tileFeature){
    if (!tileFeature || !tileFeature.coordinates || !Array.isArray(tileFeature.coordinates)) {
      throw new Error(`invalid tile feature error[${JSON.stringify(tileFeature)}]`);
    }

    const leafletMarker = new L.Marker(L.latLng(tileFeature.coordinates[1], tileFeature.coordinates[0])).toGeoJSON();
    leafletMarker.properties = Object.assign({}, leafletMarker.properties || {}, tileFeature.properties);

    return leafletMarker;
  },

  clearMap() {
    if (this.markers) {
      this.markers.clearLayers();
    }

    this.tilemap.clear();
  },

  render() {
    const progressPercentage = !this.status || this.status === "loaded" ? 100 : 0;
    const state = this.getStateFromFlux();

    return (
      <div>
        <ProgressBar
          percent={progressPercentage}
          intervalTime={state.intervalTime}
          autoIncrement={true}
          className="react-progress-bar-percent-override"
          spinner="right"
        />
      </div>
     );
  }
});