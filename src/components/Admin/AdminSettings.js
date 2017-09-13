import React from 'react';
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
      router: React.PropTypes.object
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

    if (!siteSettings.name || !siteSettings.properties.title || !siteSettings.properties.logo || 
    !siteSettings.properties.supportedLanguages || !siteSettings.properties.defaultLanguage) {
      return false;
    }
    return true;
  },

  getSiteSettings() {
    return this.getFlux().store("AdminStore").getState().settings;
  },

  handleSaveSettings() {
    const { 
      targetBbox, 
      defaultLocation, 
      defaultZoomLevel 
    } = this.props.siteSettings.properties;

    const {
      name, 
      title, 
      logo, 
      defaultLanguage,
      supportedLanguages
    } = this.refs;

    const languageArray = supportedLanguages.value.split(",");
    const languageJSON = `["${languageArray.join('","')}"]`;
    const site = {
      name: name.value, 
      targetBbox: targetBbox, 
      logo: logo.value, 
      defaultLocation: defaultLocation,
      defaultLanguage: defaultLanguage.value,
      defaultZoomLevel: defaultZoomLevel, 
      supportedLanguages: JSON.parse(languageJSON), 
      title: title.value
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
                  <div className="col-lg-10">
                      <div className="form-group">
                          <label htmlFor="siteName">Site Name<span>*</span></label>
                          <input readOnly onChange={this.handleInputChange} required aria-required="true" data-rule="required" name="name" data-msg="Please enter a site name" ref="name" value={this.state.siteSettings.name} type="text" style={styles.settings.input} className="form-control settings" aria-label="siteName" />
                          <div className="validation"></div>
                      </div>
                      <div className="form-group">
                          <label>Site Title<span>*</span></label>
                          <input onChange={this.handleInputChange} required data-rule="required" data-msg="Please enter a site title" name="title" ref="title" value={this.state.siteSettings.properties.title} type="text" style={styles.settings.input} className="form-control settings" aria-label="..." />
                          <div className="validation"></div>
                      </div>
                      <div className="form-group">
                          <label>Header Logo Banner<span>*</span></label>
                          <input onChange={this.handleInputChange} required data-rule="required" data-msg="Please enter a header image for your site" name="logo" ref="logo" value={this.state.siteSettings.properties.logo} type="text" style={styles.settings.input} className="form-control settings" aria-label="..." />
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