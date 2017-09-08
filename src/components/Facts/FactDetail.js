import React from 'react';
import { Link } from 'react-router';
import { getHumanDateFromNow, UCWords, open } from '../../utils/Utils.js';
import { arrayToFragment, changeFactsUrl } from '../../utils/Fact.js';
import { SERVICES } from '../../services/Dashboard';
import Fluxxor from 'fluxxor';
import { getAdjacentArticles } from '../../utils/Fact.js';
import Chip from 'material-ui/Chip';
import MapViewPort from '../dialogs/MapViewPort';
import Sentiment from '../Graphics/Sentiment';
import Avatar from 'material-ui/Avatar';
import FontIcon from 'material-ui/FontIcon';

const sourcesBlackList = ["http://www.alchemyapi.com/", "http://www.bing.com/", "http://www.tadaweb.com/"];

// Material UI style overrides
const styles = {
  chip: {
    margin: 4,
  }
};

const FluxMixin = Fluxxor.FluxMixin(React),
  StoreWatchMixin = Fluxxor.StoreWatchMixin("FactsStore");

export const FactDetail = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin],

  _loadDetail: function (id) {
    SERVICES.FetchMessageDetail(this.props.siteKey, id, ["tadaweb"], [], (error, response, body) => {
      if (error || response.statusCode !== 200 || !body.data || !body.data.event) {
        console.error("Failed to fetch details for id:", id, error);
        return;
      }
      const payload = body.data.event;
      this.setState({ ...payload });
    });
  },

  getStateFromFlux: function () {
    return this.getFlux().store("FactsStore").getState();
  },

  componentWillReceiveProps: function (nextProps) {
    if (nextProps.factId !== this.props.factId) {
      this._loadDetail(nextProps.factId);
      this.setState({ properties: null });
    }
  },

  componentDidMount() {
    this._loadDetail(this.props.factId);
  },

  render() {
    let filter = "";
    if (this.state.selectedTags.length > 0) {
      // const tagNames = filterValues(this.state.tags, this.state.selectedRowKeys);
      filter = "tags/" + arrayToFragment(this.state.selectedTags);
    }
    const back = "/site/{0}/facts/{1}".format(this.props.siteKey, filter);

    // loading state
    if (!this.state.properties) {
      return (
        <div id="fact">
          <div className="container-fluid">

            <div className="row topBar">
              <div className="col-md-3">
                <Link to={back} className="navBtn">&lt; Back</Link>
              </div>
              <div className="col-md-6">
              </div>
              <div className="col-md-3">
              </div>
            </div>

            <div className="loadingPage"><p>Loading fact&hellip;</p></div>
          </div>
        </div>
      );
    }

    // error
    if (this.state.error) {
      return (
        <div id="fact">
          <div className="container-fluid">

            <div className="row topBar">
              <div className="col-md-3">
                <Link to={back} className="navBtn">&lt; Back</Link>
              </div>
              <div className="col-md-6">
              </div>
              <div className="col-md-3">
              </div>
            </div>

            <div className="row">
              <div className="col-md-12"><h1>Error, fact data not found.</h1></div>
            </div>

          </div>
        </div>
      );
    }

    const factDetail = this.state.properties || {};
    const dateCreated = getHumanDateFromNow(factDetail.createdtime, "MM/DD/YYYY HH:mm:s A");
    const text = factDetail.fullText || factDetail.sentence;
    const originalSource = factDetail.properties.originalSources && factDetail.properties.originalSources.length > 0 ? factDetail.properties.originalSources : "";
    const title = factDetail.properties.title || "";
    const tags = factDetail.edges || [];
    const link = factDetail.properties.link || "";
    const sentiment = factDetail.sentiment;

    const result = getAdjacentArticles(this.props.factId, this.state.facts);
    const prev = result.prev;
    const next = result.next;
    let prevTitle, nextTitle;
    if (prev) prevTitle = prev.properties.properties.title || prev.properties.sentence;
    if (next) nextTitle = next.properties.properties.title || next.properties.sentence;

    return (
      <div id="fact">
        <div className="container-fluid">

          <div className="row topBar">
            <div className="col-md-3">
              <Link to={back} className="navBtn">&lt; Back</Link>
            </div>
            <div className="col-md-6">
            </div>
            <div className="col-md-3">
            </div>
          </div>

          <div className="row whitespace">
            <div className="col-md-3">
              <div className="details">
                {prev && <Link to={`/site/${this.props.siteKey}/facts/detail/${prev.properties.messageid}`} className="truncate">&larr; {prevTitle}</Link>}
              </div>
              <div className="map">
                <MapViewPort coordinates={this.state.coordinates} mapSize={[375, 400]} />
              </div>
            </div>
            <div className="col-md-6">
              <div className="details">
                {next && <Link to={`/site/${this.props.siteKey}/facts/detail/${next.properties.messageid}`} className="truncate">&rarr; {nextTitle}</Link>}
              </div>
              <div className="article">
                <h1>{title}</h1>
                <p className="text">{text}</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="details">
                <p className="drop">
                  {
                    link !== "" ? <a href={link} target="_blank">Read Original</a>
                      : undefined
                  }
                </p>

                <p className="subheading">Date created</p>
                <p className="drop"><i className="fa fa-clock-o fa-1"></i><span className="date">{dateCreated}</span></p>

                <p className="subheading">Sentiment</p>
                <div className="drop">
                  <Sentiment value={sentiment}></Sentiment>
                </div>

                <p className="subheading">Sources</p>
                <ul className="drop">
                  {originalSource && originalSource.filter(source => sourcesBlackList.indexOf(source) === -1).map(source => {
                    let sourceFormatted = source.replace(/http:\/\/www./g, '').replace(/.com\//g, '').replace(/http:\/\//g, '').replace(/https:\/\//g, '');

                    return <Chip key={sourceFormatted} onTouchTap={(event) => open(source)} style={styles.chip}>
                      <Avatar icon={<FontIcon className="material-icons">share</FontIcon>} />
                      {sourceFormatted}
                    </Chip>;
                  })}
                </ul>

                <p className="subheading">Tags</p>
                <div className="drop">
                  {tags.map(function (tag) {
                    const name = UCWords(tag);
                    return <Chip key={tag} style={styles.chip} onTouchTap={(event) => this.handleSelectTag(tag)}>{name}</Chip>;
                  }, this)}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    );
  },

  handleSelectTag(tag) {
    changeFactsUrl(this.props.siteKey, [tag]);
  },

});
