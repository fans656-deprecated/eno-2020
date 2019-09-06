import React from 'react';
import { Radio, Modal, Card, Divider, Table, Button, Input, List, message } from 'antd';
import yaml from 'js-yaml';

import { error } from './utils';

export default class Storage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newStorageModalVisible: false,
      newStorageTemplateId: null,
      newStorageAttrs: '',
      newStorageName: '',
    };
    this.idToStorageTemplate = {};
  }

  render() {
    return (
      <div>
        <Card title="Server" size="small">
        </Card>
        <Card title="Cloud"
          style={{marginTop: '1em'}}
          extra={<a onClick={this.onNewStorage}>New</a>}
          size="small"
        >
          <Table
            pagination={false}
            columns={this._getStorageTableColumns()}
            dataSource={this.props.storages}
          />
        </Card>
        {this.renderNewStorageModal()}
      </div>
    );
  }

  renderNewStorageModal() {
    return (
      <Modal
        title="New storage"
        visible={this.state.newStorageModalVisible}
        closable={false}
        okText="Create"
        onOk={this.createNewStorage}
        onCancel={() => this.setState({newStorageModalVisible: false})}
      >
        <Radio.Group
          buttonStyle="solid"
          value={this._newStorageTemplateId()}
          onChange={e => this.setState({newStorageTemplateId: e.target.value})}
        >
          {this.props.storageTemplates.map(template => (
            <Radio.Button
              key={template.id}
              value={template.id}
            >{template.name}</Radio.Button>
          ))}
        </Radio.Group>
        <Input
          placeholder="Storage name"
          value={this.state.newStorageName}
          onChange={e => this.setState({newStorageName: e.target.value})}
        />
        <Input.TextArea
          placeholder="Enter storage config here (in YAML format)"
          rows={15}
          style={{fontFamily: 'Consolas'}}
          value={this.state.newStorageAttrs}
          onChange={e => this.setState({newStorageAttrs: e.target.value})}
        />
      </Modal>
    );
  }

  onNewStorage = () => {
    this.setState({
      newStorageModalVisible: true,
    });
  }

  createNewStorage = async () => {
    const data = this._newStorageAttrs();
    data.name = this.state.newStorageName;
    data.template_id = this._newStorageTemplateId();
    console.log(data);
    const res = await fetch('/api/storages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.status === 200) {
      this.setState({newStorageModalVisible: false}, this.props.storagesChanged);
    } else {
      error(`Failed to create storage (${res.status})`, await res.text());
    }
  }

  _newStorageTemplateId() {
    return this.state.newStorageTemplateId || (this.props.storageTemplates[0] || {}).id;
  }

  _newStorageAttrs() {
    let attrs = null;
    try {
      attrs = yaml.safeLoad(this.state.newStorageAttrs);
    } catch (e) {
      // do nothing
    }
    return attrs || {};
  }

  _getStorageTableColumns = () => {
    return [
      {
        title: 'Name',
        dataIndex: 'name',
      },
      {
        title: 'Type',
        dataIndex: 'template.name',
      },
      {
        title: 'Size',
        dataIndex: 'size',
      },
      {
        title: 'Actions',
        render: (_, storage) => {
          return (
            <span>
              <a>Edit</a>
              <Divider type="vertical"/>
              <a>Delete</a>
            </span>
          );
        },
      },
    ]
  }
}
