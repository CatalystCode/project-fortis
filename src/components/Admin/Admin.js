import React from 'react';
import Fluxxor from 'fluxxor';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { AdminSettings } from './AdminSettings';
import { AdminWatchlist } from './AdminWatchlist';
import { CustomEventsEditor } from './CustomEventsEditor';
import { FacebookPagesEditor } from './FacebookPagesEditor';
import { AdminTrustedTwitterAcc } from './AdminTrustedTwitterAcc';
import { BlacklistEditor } from './BlacklistEditor';
import { StreamEditor } from './StreamEditor';
import { AdminTwitterAccounts } from './AdminTwitterAccounts';
import { AdminLocations } from './AdminLocations';
import '../../styles/Admin/Admin.css'

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

const SETTINGS_TAB = 0;
const WATCHLIST_TAB = 1;
const LOCATIONS_TAB = 2;
const CUSTOM_EVENTS_TAB = 3;
const FB_PAGES_TAB = 4;
const TRUSTED_TWITTER_ACCTS = 5; 
const TWITTER_ACCOUNTS_TAB = 6;
const BLACKLIST_TAB = 7;
const STREAM_TAB = 8;

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

export const Admin = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin],
  displayName: 'Admin',
  
  getInitialState(){
    return{
      index: 0
    }
  },

  componentDidMount(){
    this.getFlux().actions.ADMIN.load_localities(this.props.siteKey);
  },

  componentWillReceiveProps(nextProps) {
    this.setState(this.getStateFromFlux());
  },

  getStateFromFlux() {
    return this.getFlux().store("AdminStore").getState();
  },

  handleTabChanged(index, last){
    this.setState({index});
  },

  render() {
    return (
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
                    <Tab>Facebook pages</Tab>
                    <Tab>Trusted Twitter Accounts</Tab>
                    <Tab>Twitter API Accounts</Tab>
                    <Tab>Blacklisted Term(s)</Tab>
                    <Tab>Stream(s)</Tab>
                  </TabList>
                  <TabPanel>
                    <h2>Settings</h2>
                    {
                      this.state.settings && this.state.settings.properties && this.state.index === SETTINGS_TAB ? 
                      <AdminSettings {...this.props}
                        index={this.state.index}
                        siteSettings={this.state.settings}
                      />
                      : undefined
                    }
                  </TabPanel>
                  <TabPanel>
                    <h2>Watchlist</h2>
                      <div className="adminTable">
                        {
                          this.state.settings && this.state.settings.properties && this.state.watchlist && this.state.index === WATCHLIST_TAB ? 
                          <AdminWatchlist {...this.props}/>
                          : undefined
                        }
                      </div>
                  </TabPanel>
                  <TabPanel>
                    <h2>Monitored Places&nbsp; / Geo-Fence<small></small></h2>
                    <div className="adminTable">
                      {
                        this.state.settings && this.state.settings.properties && this.state.locations && this.state.index === LOCATIONS_TAB ?
                        <AdminLocations {...this.props} rows = { Array.from(this.state.locations.values())} /> 
                        : undefined
                      }
                    </div>
                  </TabPanel>
                  <TabPanel>
                    <h2>Event Import</h2>
                    <div className="adminTable">
                      {
                        this.state.settings && this.state.settings.properties && this.state.index === CUSTOM_EVENTS_TAB ? 
                        <CustomEventsEditor {...this.props}/> : undefined
                      }
                    </div>
                  </TabPanel>
                  <TabPanel>
                    <h2>Facebook pages</h2>
                    <div className="adminTable">
                      {
                        this.state.settings && this.state.settings.properties && this.state.index === FB_PAGES_TAB ? 
                        <FacebookPagesEditor {...this.props}/> : undefined
                      }
                    </div>
                  </TabPanel>
                  <TabPanel>
                    <h2>Trusted Twitter Accounts</h2>
                    <div className="adminTable">
                      {
                        this.state.settings && this.state.settings.properties && this.state.index === TRUSTED_TWITTER_ACCTS ? 
                        <AdminTrustedTwitterAcc {...this.props}/> : undefined
                      }
                    </div>
                  </TabPanel>
                  <TabPanel>
                    <h2>Twitter API Accounts</h2>
                    <div>
                      {
                        this.state.settings && this.state.settings.properties && this.state.index === TWITTER_ACCOUNTS_TAB ? 
                        <AdminTwitterAccounts {...this.props}/> : undefined
                      }
                    </div>
                  </TabPanel>
                  <TabPanel> 
                    <h2>Blacklisted Term(s)</h2>
                    <div className="adminTable">
                      {
                        this.state.settings && this.state.settings.properties && this.state.index === BLACKLIST_TAB ? 
                        <BlacklistEditor {...this.props}/> : undefined
                      }
                    </div>
                  </TabPanel>
                  <TabPanel> 
                    <h2>Stream(s)</h2>
                    <div className="adminTable">
                      {
                        this.state.settings && this.state.settings.properties && this.state.index === STREAM_TAB ? 
                        <StreamEditor {...this.props}/> : undefined
                      }
                    </div>
                  </TabPanel>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
});