import React from 'react';
import { SERVICES } from '../../services/Dashboard';
import async from 'async';
import L from 'leaflet';
import '../../styles/Insights/HeatMap.css';
import numeralLibs from 'numeral';
import { hasChanged } from './shared';
import ClusterGroup from 'react-leaflet-markercluster';

L.Icon.Default.imagePath = "https://unpkg.com/leaflet@1.0.2/dist/images/";

export default class MarkerClusterGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      markers: []
    };

    this.clusterIconFunction = this.clusterIconFunction.bind(this);
    this.asyncFetchHeatmapFromTileService = this.asyncFetchHeatmapFromTileService.bind(this);
  }

  componentDidMount() {
    this.rebuildHeatmap();
  }

  componentWillReceiveProps(nextProps) {
    if (hasChanged(this.props, nextProps)) {
      this.rebuildHeatmap();
    }    
  }

  rebuildHeatmap() {
    let self = this;

    if (!this.props.bbox) {
      return;
    }

    this.asyncFetchHeatmapFromTileService((err, heatmapClusters) => {
      if (err) return;

      const markers = self.buildHeatmap(heatmapClusters);
      self.clearClusters();
      self.setState({ markers });
    });
  }

  clearClusters(){
    this.refs.clusterGroup.leafletElement.clearLayers();
  }

  asyncFetchHeatmapFromTileService(callback) {
    const { dataSource, timespanType, termFilters, zoomLevel,
      maintopic, externalsourceid, fromDate, toDate, heatmapTileIds } = this.props;

    async.concat(heatmapTileIds, (tileId, tileCallback) => {
      SERVICES.getHeatmapTiles(fromDate, toDate, zoomLevel, maintopic, tileId, timespanType,
        dataSource, externalsourceid, Array.from(termFilters), (error, response, heatmap) => {
          if (!error) {
            tileCallback(null, heatmap.data.heatmap.features);
          } else {
            console.error(error);
            tileCallback(null, null);
          }
        });
    }, callback);
  }

  tileToMarker(tile) {
    const { coordinates, properties } = tile;
    const options = Object.assign({}, properties);

    return Object.assign({}, { lat: coordinates[1], lng: coordinates[0] }, { options });
  }

  getSentimentCategory(level) {
    if (level >= 0 && level < 30) {
      return "positive";
    } else if (level >= 30 && level < 60) {
      return "neutral";
    } else{
      return "negative";
    }
  }

  clusterCssFunction(cluster) {
    const { clusterColorField } = this.props;
    const baseCssClass = 'marker-cluster-base marker-cluster';
    const maxClusterValue = cluster.getAllChildMarkers().reduce((prevMax, b) => Math.max(prevMax, b.options[clusterColorField]), 0);
    const clusterCssClass = this.getSentimentCategory((maxClusterValue || 0) * 100);

    return `${baseCssClass}-${clusterCssClass}`;
  }

  clusterIconFunction(cluster) {
    const { clusterValueField } = this.props;
    const cssClass = this.clusterCssFunction(cluster);
    const value = cluster.getAllChildMarkers().reduce((prevTotal, child) => child.options[clusterValueField] + prevTotal, 0);

    return L.divIcon({
      html: `<span>${numeralLibs(value).format(value > 1000 ? '+0.0a' : '0a')}</span>`,
      className: cssClass,
      iconSize: L.point(40, 40, true)
    });
  }

  buildHeatmap = heatmaps => heatmaps.map(this.tileToMarker);

  render() {
    if (!this.props.bbox.length) return null;
    const { markers } = this.state;

    const config = {
      chunkedLoading: true,
      zoomToBoundsOnClick: true,
      showCoverageOnHover: true,
      iconCreateFunction: this.clusterIconFunction,
      singleMarkerMode: true
    };

    return (
      <ClusterGroup
        wrapperOptions={{enableDefaultStyle: true}}
        ref="clusterGroup"
        markers={markers}
        options={config}
      />
    );
  }
}