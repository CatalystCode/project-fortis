import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { Modal, Button } from 'react-bootstrap'; 
import { AdminSettings } from './AdminSettings';
import AdminWatchlist from './AdminWatchlist';
import { CustomEventsEditor } from './CustomEventsEditor';
import TrustedSources from './TrustedSources';
import { BlacklistEditor } from './BlacklistEditor';
import StreamEditor from './StreamEditor';
import AdminLocations from './AdminLocations';
import '../../styles/Admin/Admin.css';

const SETTINGS_TAB = 0;
const WATCHLIST_TAB = 1;
const LOCATIONS_TAB = 2;
const CUSTOM_EVENTS_TAB = 3;
const TRUSTED_SOURCES = 4;
const BLACKLIST_TAB = 5;
const STREAM_TAB = 6;

const styles = {
  container: {
    panel: {
      marginTop: '6px'
    },
    panelHeading: {
      paddingTop: '3px',
      paddingBottom: '3px'
    }
  }
};

class Admin extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      index: 0,
      showModal: false
    };

    this.closeModal = this.closeModal.bind(this);
    this.openModal = this.openModal.bind(this);
    this.handleTabChanged = this.handleTabChanged.bind(this);
    this.restartPipelineAndCloseModal = this.restartPipelineAndCloseModal.bind(this);
  }

  closeModal() {
    this.setState({ showModal: false });
  }

  openModal() {
    this.setState({ showModal: true });
  }

  handleTabChanged(index, last) {
    this.setState({ index });
  }

  restartPipelineAndCloseModal() {
    this.props.flux.actions.ADMIN.restart_pipeline();
    this.closeModal();
  }

  render() {
    return (
      <div>
        <div className="container-fluid">
          <div className="col-lg-12">
            <div className="panel panel-primary" style={styles.container.panel}>
              <div className="panel-body">
                  <div className="row adminContainer">
                  <Tabs
                    onSelect={this.handleTabChanged}
                    selectedIndex={this.state.index}>
                    <TabList>
                      <Tab>Site Settings</Tab>
                      <Tab>Watchlist</Tab>
                      <Tab>Geofence / Monitored places</Tab>
                      <Tab>Event Import</Tab>
                      <Tab>Trusted Sources</Tab>
                      <Tab>Blacklisted Terms</Tab>
                      <Tab>Streams</Tab>
                    </TabList>
                    <TabPanel>
                      <h2>Settings</h2>
                      {
                        this.props.settings && this.props.settings.properties && this.state.index === SETTINGS_TAB ?
                        <AdminSettings {...this.props}
                          index={this.state.index}
                          siteSettings={this.props.settings}
                        />
                        : undefined
                      }
                    </TabPanel>
                    <TabPanel>
                      <h2>Watchlist</h2>
                        <div className="adminTable">
                          {
                            this.props.settings && this.props.settings.properties && this.props.watchlist && this.state.index === WATCHLIST_TAB ?
                            <AdminWatchlist {...this.props}/>
                            : undefined
                          }
                        </div>
                    </TabPanel>
                    <TabPanel>
                      <h2>Monitored Places&nbsp; / Geo-Fence<small></small></h2>
                      <div className="adminTable">
                        {
                          this.props.settings && this.props.settings.properties && this.state.index === LOCATIONS_TAB ?
                          <AdminLocations name={this.props.settings.name}
                                          {...this.props} 
                                          {...this.props.settings.properties} />
                          : undefined
                        }
                      </div>
                    </TabPanel>
                    <TabPanel>
                      <h2>Event Import</h2>
                      <div className="adminTable">
                        {
                          this.props.settings && this.props.settings.properties && this.state.index === CUSTOM_EVENTS_TAB ?
                          <CustomEventsEditor {...this.props}/> : undefined
                        }
                      </div>
                    </TabPanel>
                    <TabPanel>
                      <h2>Trusted Sources</h2>
                      <div className="adminTable">
                        {
                          this.props.settings && this.props.settings.properties && this.state.index === TRUSTED_SOURCES ?
                          <div>
                            <TrustedSources {...this.props}/>
                          </div> : undefined
                        }
                      </div>
                    </TabPanel>
                    <TabPanel>
                      <h2>Blacklisted Terms</h2>
                      <div className="adminTable">
                        {
                          this.props.settings && this.props.settings.properties && this.state.index === BLACKLIST_TAB ?
                          <BlacklistEditor {...this.props}/> : undefined
                        }
                      </div>
                    </TabPanel>
                    <TabPanel>
                      <h2>Streams</h2>
                      <div className="adminTable">
                        {
                          this.props.settings && this.props.settings.properties && this.state.index === STREAM_TAB ?
                          <StreamEditor {...this.props}/> : undefined
                        }
                      </div>
                    </TabPanel>
                  </Tabs>
                  <div className="row adminContainer">
                    <Button className="pull-right" bsStyle="danger" onClick={this.openModal}>Restart Pipeline</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Modal show={this.state.showModal} onHide={this.closeModal} aria-labelledby="contained-modal-title-sm">
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-sm">Restart Pipeline</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to restart the pipeline?
          </Modal.Body>
          <Modal.Footer>
            <Button bsStyle="primary" onClick={this.restartPipelineAndCloseModal}>Yes, I&#8217;m sure</Button>
            <Button onClick={this.closeModal}>No, don&#8217;t restart</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}

export default Admin;