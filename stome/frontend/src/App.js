import React from 'react';
import { Layout, Menu, Drawer, message } from 'antd';
import 'antd/dist/antd.min.css';

import Explorer from './Explorer';
import Transfer from './Transfer';
import Storage from './Storage';
import { api } from './utils';
import './App.css';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      storageTemplates: [],
      storages: [],
      transferDrawerVisible: process.browser && window.location.hash === '#transfer',
      storageDrawerVisible: process.browser && window.location.hash === '#storage',
    };
  }

  componentDidMount = async () => {
    await this._fetchStorageTemplates();
    await this._fetchStorages();
  }

  render() {
    return (
      <Layout style={{minHeight: '100%'}}>
        {this.renderHeader()}
        {this.renderExplorer()}
        {this.renderTransfer()}
        {this.renderStorage()}
      </Layout>
    );
  }

  renderHeader = () => {
    return (
      <Layout.Header style={{height: '40px', paddingLeft: 0}}>
        <Menu
          theme="dark"
          mode="horizontal"
          style={{display: 'flex', lineHeight: '40px', padding: 0}}
          selectedKeys={[]}
        >
          <Menu.Item>
            <span className="logo">Stome</span>
          </Menu.Item>
          <Menu.Item key="transfer" onClick={() => this._showDrawer('transfer')}>
            Transfer
          </Menu.Item>
          <Menu.Item key="storage" onClick={() => this._showDrawer('storage')}>
            Storage
          </Menu.Item>
        </Menu>
      </Layout.Header>
    );
  }

  renderExplorer = () => {
    return (
      <Layout.Content className="layout-content">
        <Explorer
          storages={this.state.storages}
        />
      </Layout.Content>
    );
  }

  renderTransfer = () => {
    return this._renderDrawer('Transfer', 'transferDrawerVisible', (
      <Transfer
        storages={this.state.storages}
      />
    ));
  }

  renderStorage = () => {
    return this._renderDrawer('Storage', 'storageDrawerVisible', (
      <Storage
        storageTemplates={this.state.storageTemplates}
        storages={this.state.storages}
        storagesChanged={this._fetchStorages}
      />
    ));
  }

  _renderDrawer = (title, visibleStateName, children) => {
    return (
      <Drawer
        title={title}
        visible={this.state[visibleStateName]}
        closable={false}
        onClose={() => {
          history.replaceState(null, null, ' ');
          this.setState({[visibleStateName]: false});
        }}
        width="50%"
      >
        {children}
      </Drawer>
    );
  }

  _showDrawer = (name) => {
    window.location.hash = `#${name}`;
    this.setState({[`${name}DrawerVisible`]: true});
  }

  _fetchStorageTemplates = async () => {
    const templates = (await api.get('/api/storage-templates')).data;
    this.setState({storageTemplates: templates});
  }

  _fetchStorages = async () => {
    const storages = (await api.get('/api/storages')).data;
    const templates = _.keyBy(this.state.storageTemplates, t => t.id);
    for (const storage of storages) {
      storage.key = storage.id;
      storage.template = templates[storage.template_id];
    }
    this.setState({storages: storages});
  }
}
