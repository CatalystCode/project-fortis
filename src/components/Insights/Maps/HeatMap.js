import MarkerClusterGroup from './MarkerClusterGroup';
import { Map, TileLayer, ZoomControl, Rectangle } from 'react-leaflet';
import constants from '../../../actions/constants';
import React from 'react';
import { tileFromTileId } from 'geotile';
import { hasChanged } from '../shared';
import '../../../styles/Insights/HeatMap.css';
import 'leaflet/dist/leaflet.css';

export default class HeatMap extends React.Component {
  constructor(props) {
    super(props);
    const { defaultZoom, targetBbox } = props;

    const bounds = targetBbox.length && targetBbox.length === 4 ? [[targetBbox[1], targetBbox[0]], [targetBbox[3], targetBbox[2]]] : [];
    this.onViewportChanged = this.onViewportChanged.bind(this);
    this.updateBounds = this.asyncInvokeDashboardRefresh.bind(this);
    this.changeMapBoundsWithTile = this.changeMapBoundsWithTile.bind(this);
    const maxbounds = targetBbox.length && targetBbox.length === 4 ? [[targetBbox[0], targetBbox[1]], [targetBbox[2], targetBbox[3]]] : [];

    this.state = {
      bounds: bounds,
      placeid: "",
      defaultZoom: parseFloat(defaultZoom || 6),
      maxbounds: maxbounds
    };
  }

  onViewportChanged(viewport) {
    if (this.ready) {
      this.cancelQueuedProcess();
      this.refreshTimerId = setTimeout(this.asyncInvokeDashboardRefresh(viewport), constants.MAP.DEBOUNCE);
    }

    this.ready = true;
  }

  getLeafletBbox() {
    const { bbox, selectedplace } = this.props;

    if (!this.refs.map) {
      return undefined;
    } else if (selectedplace.placeid) {
      return bbox;
    }

    const bounds = this.refs.map.leafletElement.getBounds();

    return [bounds.getNorth(), bounds.getWest(), bounds.getSouth(), bounds.getEast()];
  }

  asyncInvokeDashboardRefresh(viewport) {
    if (this.refs.map) {
      const { dataSource, timespanType, termFilters, datetimeSelection, maintopic, externalsourceid,
        fromDate, toDate, selectedplace } = this.props;
      const bbox = this.getLeafletBbox();
      const zoom = this.refs.map.leafletElement.getZoom();

      this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection,
        timespanType, dataSource, maintopic, bbox, zoom, Array.from(termFilters), externalsourceid, null, selectedplace);
    }
  }

  cancelQueuedProcess() {
    if (this.refreshTimerId) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return hasChanged(this.props, nextProps);
  }

  componentWillReceiveProps(nextProps) {
    const { placeid, defaultZoom } = this.state;

    if (hasChanged(this.props, nextProps) && nextProps.selectedplace.placeid && placeid !== nextProps.selectedplace.placeid) {
      this.moveMapToNewLocation(nextProps, defaultZoom);
    }
  }

  moveMapToNewLocation(props, zoom) {
    const { selectedplace } = props;
    this.refs.map.leafletElement.setView(selectedplace.placecentroid, zoom);
    this.setState({ placeid: selectedplace.placeid });
  }

  changeMapBoundsWithTile(tileid){
    const {latitudeNorth, latitudeSouth, longitudeWest, longitudeEast } = tileFromTileId(tileid)
    const bounds = [[latitudeNorth, longitudeWest], [latitudeSouth, longitudeEast]];

    this.refs.map.leafletElement.fitBounds(bounds);
  }

  formatLeafletBounds(bbox) {
    if (bbox.length === 4) {
      return [[bbox[1], bbox[0]], [bbox[3], bbox[2]]];
    }

    console.error('Bad bbox format');
  }

  renderRectangle(bbox) {
    const bboxRectangleColor = "#0ff";
    const bounds = [[bbox[0], bbox[1]], [bbox[2], bbox[3]]];

    return <Rectangle
      bounds={bounds}
      fill={false}
      color={bboxRectangleColor}
    />;
  }

  render() {
    const { maxbounds, defaultZoom } = this.state;
    const { selectedplace } = this.props;
    const maxzoom = defaultZoom + constants.MAP.MAXZOOM;

    return (
      <Map
        onzoomend={this.onViewportChanged}
        ondragend={this.onViewportChanged}
        bounds={this.state.bounds}
        ref="map"
        id="leafletMap"
        maxBounds={maxbounds}
        useFlyTo={true}
        zoomControl={false} >

        <TileLayer url={constants.MAP.TILE_LAYER_URL}
          maxZoom={maxzoom}
          minZoom={defaultZoom}
          attribution='Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>'
          accessToken={constants.MAP.MAPBOX_ACCESS_TOKEN} />

        <ZoomControl
          position={'topright'}
        />

        {selectedplace.placeid ? this.renderRectangle(selectedplace.placebbox) : undefined}

        <MarkerClusterGroup
            clusterColorField={"avgsentiment"}
            clusterValueField={"mentions"}
            moveMapToNewLocation={this.changeMapBoundsWithTile}
            {...this.props}
        />
      </Map>
    )
  }
}