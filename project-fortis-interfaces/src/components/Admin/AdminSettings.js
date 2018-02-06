import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Button from 'react-bootstrap/lib/Button';
import Fluxxor from 'fluxxor';
import '../../styles/Admin/Admin.css'
import SiteExportButton from './SiteExportButton';
import { doNothing } from '../../utils/Utils';

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

const styles = {
  settings: {
    input: {
      width: '30%'
    },
    container: {
      display: 'flex'
    },
    label:{
      fontWeight: 500,
      color: '#3f3f4f',
      margin: '0 0 2px'
    },
    lablelLink: {
      color: '#3f3f4f',
      textDecoration: 'underline'
    },
    buttonRow: {
      marginTop: '20px'
    },
    labelInfo: {
      fontStyle: 'italic',
      fontWeight: 400,
      color: '#000'
    }
  }
};

export const AdminSettings = createReactClass({
  mixins: [FluxMixin, StoreWatchMixin],

  contextTypes: {
    router: PropTypes.object
  },

  getInitialState() {
    return {
      "isFormValid": this.isFormValid(),
      "siteSettings": {},
      "saving": false
    }
  },

  getStateFromFlux() {
    return this.getFlux().store("AdminStore").getState();
  },

  componentWillReceiveProps(nextProps) {
    const { siteSettings } = nextProps;

    this.setState({ siteSettings });
  },

  componentDidMount() {
    const { siteSettings } = this.props;

    this.setState({ siteSettings });
  },

  handleInputChange(event) {
    let siteSettingsMutable = this.state.siteSettings;
    let fieldName = event.target.name;

    if (fieldName === "name") {
      siteSettingsMutable.name = event.target.value;
    } else {
      siteSettingsMutable.properties[fieldName] = event.target.value;
    }

    this.setState({
      isFormValid: this.isFormValid(),
      siteSettings: siteSettingsMutable,
      saving: false
    });
  },

  isFormValid() {
    return Object.keys(this.getSiteSettings().properties).every(this.isPropertySet);
  },

  isPropertySet(key) {
    const value = String(this.getSiteSettings().properties[key]);
    return value && value.length > 0;
  },

  getSiteSettings() {
    return this.getFlux().store("AdminStore").getState().settings;
  },

  handleSaveSettings() {
    const {
      defaultLocation,
      defaultZoomLevel
    } = this.props.siteSettings.properties;

    const {
      name
    } = this.props.siteSettings;

    const {
      title,
      logo,
      targetBbox,
      defaultLanguage,
      supportedLanguages,
      featureservicenamespace,
      mapSvcToken,
      translationSvcToken,
      cogSpeechSvcToken,
      cogVisionSvcToken,
      cogTextSvcToken
    } = this.refs;

    const languageArray = supportedLanguages.value.split(",");
    const languageJSON = `["${languageArray.join('","')}"]`;
    const bboxJSON = `[${targetBbox.value}]`;

    const site = {
      name: name,
      targetBbox: JSON.parse(bboxJSON),
      logo: logo.value,
      defaultLocation: defaultLocation,
      defaultLanguage: defaultLanguage.value,
      defaultZoomLevel: defaultZoomLevel,
      supportedLanguages: JSON.parse(languageJSON),
      title: title.value,
      featureservicenamespace: featureservicenamespace.value,
      mapSvcToken: mapSvcToken.value,
      translationSvcToken: translationSvcToken.value,
      cogSpeechSvcToken: cogSpeechSvcToken.value,
      cogVisionSvcToken: cogVisionSvcToken.value,
      cogTextSvcToken: cogTextSvcToken.value
    };

    this.setState({
      "saving": true
    });

    this.getFlux().actions.ADMIN.save_settings(site);
  },

  render() {
    if (!this.state.siteSettings.properties) {
      return <div />;
    }

    const { isFormValid, saving } = this.state;

    return (
      <div className="row">
        <form ref="settingsForm">
          <div className="col-lg-6">
            <div className="form-group">
              <label htmlFor="siteName">Site Name<span>*</span></label>
              <input readOnly onChange={this.handleInputChange} required data-rule="required" name="name" data-msg="Please enter a site name" ref="name" value={this.state.siteSettings.name} type="text" style={styles.settings.input} className="form-control settings" />
              <div className="validation"></div>
            </div>
            <div className="form-group">
              <label>Site Title<span>*</span></label>
              <input onChange={this.handleInputChange} required data-rule="required" data-msg="Please enter a site title" name="title" ref="title" value={this.state.siteSettings.properties.title} type="text" style={styles.settings.input} className="form-control settings" />
              <div className="validation"></div>
            </div>
            <div className="form-group">
              <label htmlFor="targetBbox"><a style={styles.settings.lablelLink} href="http://boundingbox.klokantech.com/" title="Click to open bounding box selection helper too and copy the bounding box in the format north,west,south,east into the field below">Bounding Box</a> (<span style={styles.settings.labelInfo}>comma seperated e.g. 40.9,-74,40.47,-73.7</span>)<span>*</span></label>
              <input onChange={this.handleInputChange} required data-rule="required" name="targetBbox" data-msg="Please enter a bounding box. The format is four comma separated numbers: north,west,south,east" ref="targetBbox" value={this.state.siteSettings.properties.targetBbox} type="text" style={styles.settings.input} className="form-control settings" />
              <div className="validation"></div>
            </div>
            <div className="form-group">
              <label>Header Logo Banner<span>*</span></label>
              <input onChange={this.handleInputChange} required data-rule="required" data-msg="Please enter a header image for your site" name="logo" ref="logo" value={this.state.siteSettings.properties.logo} type="text" style={styles.settings.input} className="form-control settings" />
              <div className="validation"></div>
            </div>
            <div className="form-group">
              <label>Supported Languages (<span style={styles.settings.labelInfo}>comma seperated e.g. en,ar</span>)<span>*</span></label>
              <input onChange={this.handleInputChange} required name="supportedLanguages" ref="supportedLanguages" value={this.state.siteSettings.properties.supportedLanguages} type="text" style={styles.settings.input} className="form-control settings" />
              <div className="validation"></div>
            </div>
            <div className="form-group">
              <label>Default Languages (<span style={styles.settings.labelInfo}>e.g. en</span>)<span>*</span></label>
              <input onChange={this.handleInputChange} required name="defaultLanguage" ref="defaultLanguage" value={this.state.siteSettings.properties.defaultLanguage} type="text" style={styles.settings.input} className="form-control settings" />
              <div className="validation"></div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="form-group">
              <label>Feature Service Namespace</label>
              <input onChange={this.handleInputChange} required name="featureservicenamespace" ref="featureservicenamespace" value={this.state.siteSettings.properties.featureservicenamespace} type="text" style={styles.settings.input} className="form-control settings" />
              <div className="validation"></div>
            </div>
            <div className="form-group">
              <label>MapBox Token</label>
              <input onChange={this.handleInputChange} required name="mapSvcToken" ref="mapSvcToken" value={this.state.siteSettings.properties.mapSvcToken} type="text" style={styles.settings.input} className="form-control settings secret" />
              <div className="validation"></div>
            </div>
            <div className="form-group">
              <label>Translation Services Token</label>
              <input onChange={this.handleInputChange} required name="translationSvcToken" ref="translationSvcToken" value={this.state.siteSettings.properties.translationSvcToken} type="text" style={styles.settings.input} className="form-control settings secret" />
              <div className="validation"></div>
            </div>
            <div className="form-group">
              <label>Cognitive Speech Services Token</label>
              <input onChange={this.handleInputChange} required name="cogSpeechSvcToken" ref="cogSpeechSvcToken" value={this.state.siteSettings.properties.cogSpeechSvcToken} type="text" style={styles.settings.input} className="form-control settings secret" />
              <div className="validation"></div>
            </div>
            <div className="form-group">
              <label>Cognitive Vision Services Token</label>
              <input onChange={this.handleInputChange} required name="cogVisionSvcToken" ref="cogVisionSvcToken" value={this.state.siteSettings.properties.cogVisionSvcToken} type="text" style={styles.settings.input} className="form-control settings secret" />
              <div className="validation"></div>
            </div>
            <div className="form-group">
              <label>Cognitive Text Services Token</label>
              <input onChange={this.handleInputChange} required name="cogTextSvcToken" ref="cogTextSvcToken" value={this.state.siteSettings.properties.cogTextSvcToken} type="text" style={styles.settings.input} className="form-control settings secret" />
              <div className="validation"></div>
            </div>
            <div className="form-group">
              <div style={styles.settings.buttonRow}>
                <Button onClick={isFormValid ? this.handleSaveSettings : doNothing} disabled={!isFormValid} bsStyle={saving ? 'success' : 'primary'} bsSize="sm">
                  <Glyphicon glyph={saving ? 'floppy-saved' : 'floppy-disk'} /> {saving ? "Saved Changes" : "Save Settings"}
                </Button>
                <SiteExportButton size="sm" />
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
});