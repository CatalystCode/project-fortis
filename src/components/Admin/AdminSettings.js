import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import Fluxxor from 'fluxxor';
import '../../styles/Admin/Admin.css'

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
    const siteSettings = this.getSiteSettings();
    const sitePropertyValues = Object.keys(siteSettings.properties);

    sitePropertyValues.forEach(key => {
      if (!sitePropertyValues[key]) return false;
    });
    return true;
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
      name,
      title,
      logo,
      targetBbox,
      defaultLanguage,
      supportedLanguages,
      featureservicenamespace,
      translationSvcToken,
      cogSpeechSvcToken,
      cogVisionSvcToken,
      cogTextSvcToken
    } = this.refs;

    const languageArray = supportedLanguages.value.split(",");
    const languageJSON = `["${languageArray.join('","')}"]`;
    const bboxJSON = `[${targetBbox.value}]`
    const site = {
      name: name.value,
      targetBbox: JSON.parse(bboxJSON),
      logo: logo.value,
      defaultLocation: defaultLocation,
      defaultLanguage: defaultLanguage.value,
      defaultZoomLevel: defaultZoomLevel,
      supportedLanguages: JSON.parse(languageJSON),
      title: title.value,
      featureservicenamespace: featureservicenamespace.value,
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
      return (
        this.state.siteSettings.properties ?
          <div className="row">
              <form ref="settingsForm">
                  <div className="col-lg-6">
                      <div className="form-group">
                          <label htmlFor="siteName">Site Name<span>*</span></label>
                          <input readOnly onChange={this.handleInputChange} required aria-required="true" data-rule="required" name="name" data-msg="Please enter a site name" ref="name" value={this.state.siteSettings.name} type="text" style={styles.settings.input} className="form-control settings" aria-label="siteName" />
                          <div className="validation"></div>
                      </div>
                      <div className="form-group">
                          <label>Site Title<span>*</span></label>
                          <input onChange={this.handleInputChange} required data-rule="required" data-msg="Please enter a site title" name="title" ref="title" value={this.state.siteSettings.properties.title} type="text" style={styles.settings.input} className="form-control settings" aria-label="siteTitle" />
                          <div className="validation"></div>
                      </div>
                      <div className="form-group">
                          <label htmlFor="targetBbox">Bounding Box (<span style={styles.settings.labelInfo}>comma seperated i.e. 1,2,3,4</span>)<span>*</span></label>
                          <input onChange={this.handleInputChange} required aria-required="true" data-rule="required" name="targetBbox" data-msg="Please enter a bounding box" ref="targetBbox" value={this.state.siteSettings.targetBbox} type="text" style={styles.settings.input} className="form-control settings" aria-label="targetBbox" />
                          <div className="validation"></div>
                      </div>
                      <div className="form-group">
                          <label>Header Logo Banner<span>*</span></label>
                          <input onChange={this.handleInputChange} required data-rule="required" data-msg="Please enter a header image for your site" name="logo" ref="logo" value={this.state.siteSettings.properties.logo} type="text" style={styles.settings.input} className="form-control settings" aria-label="logo" />
                          <div className="validation"></div>
                      </div>
                      <div className="form-group">
                          <label>Supported Languages(<span style={styles.settings.labelInfo}>comma seperated i.e. en,ar</span>)<span>*</span></label>
                          <input onChange={this.handleInputChange} required name="supportedLanguages" ref="supportedLanguages" value={this.state.siteSettings.properties.supportedLanguages} type="text" style={styles.settings.input} className="form-control settings" aria-label="..." />
                          <div className="validation"></div>
                      </div>
                      <div className="form-group">
                          <label>Default Languages(<span style={styles.settings.labelInfo}>i.e. en or ar</span>)<span>*</span></label>
                          <input onChange={this.handleInputChange} required name="defaultLanguage" ref="defaultLanguage" value={this.state.siteSettings.properties.defaultLanguage} type="text" style={styles.settings.input} className="form-control settings" aria-label="..." />
                          <div className="validation"></div>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                          <label>Feature Service</label>
                          <input onChange={this.handleInputChange} required name="featureservicenamespace" ref="featureservicenamespace" value={this.state.siteSettings.properties.featureservicenamespace} type="text" style={styles.settings.input} className="form-control settings" aria-label="..." />
                          <div className="validation"></div>
                      </div>
                      <div className="form-group">
                          <label>Translation Services Token</label>
                          <input onChange={this.handleInputChange} required name="translationSvcToken" ref="translationSvcToken" value={this.state.siteSettings.properties.translationSvcToken} type="text" style={styles.settings.input} className="form-control settings" aria-label="..." />
                          <div className="validation"></div>
                      </div>
                      <div className="form-group">
                          <label>Cognitive Speech Services Token</label>
                          <input onChange={this.handleInputChange} required name="cogSpeechSvcToken" ref="cogSpeechSvcToken" value={this.state.siteSettings.properties.cogSpeechSvcToken} type="text" style={styles.settings.input} className="form-control settings" aria-label="..." />
                          <div className="validation"></div>
                      </div>
                      <div className="form-group">
                          <label>Cognitive Vision Services Token</label>
                          <input onChange={this.handleInputChange} required name="cogVisionSvcToken" ref="cogVisionSvcToken" value={this.state.siteSettings.properties.cogVisionSvcToken} type="text" style={styles.settings.input} className="form-control settings" aria-label="..." />
                          <div className="validation"></div>
                      </div>
                      <div className="form-group">
                          <label>Cognitive Text Services Token</label>
                          <input onChange={this.handleInputChange} required name="cogTextSvcToken" ref="cogTextSvcToken" value={this.state.siteSettings.properties.cogTextSvcToken} type="text" style={styles.settings.input} className="form-control settings" aria-label="..." />
                          <div className="validation"></div>
                      </div>
                      <div className="form-group">
                          <p style={styles.settings.buttonRow}>
                          {
                              this.state.isFormValid ?
                                  <button onClick={this.handleSaveSettings} type="button" className={!this.state.saving ? `btn btn-primary btn-sm addSiteButton` : `btn btn-success btn-sm addSiteButton`}>
                                    <i className="fa fa-cloud-upload" aria-hidden="true"></i> {this.state.saving ? "Saved Changes" : "Save Settings"}
                                  </button>
                              : undefined
                          }
                          </p>
                      </div>
                  </div>
              </form>
          </div>
          : <div />
      );
  }
});