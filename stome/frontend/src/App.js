import React from 'react';
import { Drawer, Layout, Menu, Button, Input, List, message } from 'antd';
import Link from 'next/link';
import Explorer from './Explorer';
import Transfer from './Transfer';
import Storage from './Storage';
import 'antd/dist/antd.min.css';
import './App.css';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      templates: [],
      storages: [],
      transferDrawerVisible: process.browser && window.location.hash === '#transfer',
      storageDrawerVisible: process.browser && window.location.hash === '#storage',
    };
  }

  componentDidMount = async () => {
    await this.fetchStorageTemplates();
    await this.fetchStorages();
  }

  render() {
    return (
      <Layout style={{minHeight: '100%'}}>
        <Layout.Header
          style={{
            height: '40px',
            paddingLeft: 0,
          }}
        >
          <Menu
            theme="dark"
            mode="horizontal"
            style={{
              display: 'flex',
              lineHeight: '40px',
              padding: 0,
            }}
            selectedKeys={[]}
          >
            <Menu.Item
              style={{
                color: '#ddd',
                fontWeight: 'bold',
                fontSize: '1.3em',
              }}
            >Stome</Menu.Item>
            <Menu.Item key="transfer"
              onClick={() => {
                window.location.hash = '#transfer';
                this.setState({transferDrawerVisible: true});
              }}
            >Transfer</Menu.Item>
            <Menu.Item key="storage"
              onClick={() => {
                window.location.hash = '#storage';
                this.setState({storageDrawerVisible: true});
              }}
            >Storage</Menu.Item>
          </Menu>
        </Layout.Header>
        <Layout.Content
          style={{
            flex: 1,
            backgroundColor: 'white',
            margin: '1em',
          }}
        >
          <Explorer
            storages={this.state.storages}
          />
        </Layout.Content>
        <Drawer
          title="Transfer"
          visible={this.state.transferDrawerVisible}
          closable={false}
          onClose={() => {
            history.replaceState(null, null, ' ');
            this.setState({transferDrawerVisible: false});
          }}
          width="50%"
        >
          <Transfer
            templates={this.state.templates}
            storages={this.state.storages}
            storagesChanged={this.fetchStorages}
          />
        </Drawer>
        <Drawer
          title="Storage"
          visible={this.state.storageDrawerVisible}
          closable={false}
          onClose={() => {
            history.replaceState(null, null, ' ');
            this.setState({storageDrawerVisible: false});
          }}
          width="50%"
        >
          <Storage
            templates={this.state.templates}
            storages={this.state.storages}
            storagesChanged={this.fetchStorages}
          />
        </Drawer>
      </Layout>
    );
  }

  fetchStorageTemplates = async () => {
    const res = await fetch('/api/storage-templates');
    if (res.status === 200) {
      const data = await res.json();
      const templates = data.data;
      this.idToTemplate = _.keyBy(templates, t => t.id);
      this.setState({
        templates: templates,
      });
    } else {
      message.error('Failed to fetch storage templates');
    }
  }

  fetchStorages = async () => {
    const res = await fetch('/api/storages');
    if (res.status === 200) {
      const data = await res.json();
      const storages = data.data;
      for (const storage of storages) {
        storage.key = storage.id;
        storage.template = this.idToTemplate[storage.template_id];
      }
      this.setState({
        storages: storages,
      });
    } else {
      message.error('Failed to fetch storage');
    }
  }
}
