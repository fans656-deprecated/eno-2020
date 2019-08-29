import React from 'react';
import _ from 'lodash';
import {
  Icon, Input, Modal, Radio, Divider, Card, Table, Button, Popconfirm,
  message, notification,
} from 'antd';
import { api, error } from './utils';

export default class NodePanel extends React.Component {
  state = {
    attachStorageModalVisible: false,
    attachStorageId: null,
  }

  constructor(props) {
    super(props);
    this.storageColums = [
      {title: 'Name', dataIndex: 'name'},
      {title: 'Status', dataIndex: 'status'},
      {title: 'Actions', render: this.renderStorageActions},
    ];
  }

  render() {
    const node = this.props.node;
    return (
      <div style={{margin: '1em'}}>
        <a href={`/api/file${node.path}`} target='_blank'>Download</a>
        <pre>
          {JSON.stringify(node, null, 2)}
        </pre>
        <Card title="Storages" size="small"
          extra={<a onClick={this.onAttachStorage}>Attach</a>}
        >
          <Table
            pagination={false}
            columns={this.storageColums}
            dataSource={this.props.availStorages}
          />
        </Card>
        {this.renderAttachStorageModal()}
      </div>
    );
  }

  renderAttachStorageModal() {
    return (
      <Modal
        title="Attach storage"
        visible={this.state.attachStorageModalVisible}
        closable={false}
        onOk={this.attachStorage}
        onCancel={() => this.setState({attachStorageModalVisible: false})}
      >
        <Radio.Group
          buttonStyle="solid"
          value={this._attachStorageId()}
          onChange={e => this.setState({attachStorageId: e.target.value})}
        >
          {this.props.availStorages.map(storage => (
            <Radio.Button
              key={storage.id}
              value={storage.id}
            >{storage.name}</Radio.Button>
          ))}
        </Radio.Group>
      </Modal>
    );
  }

  renderStorageActions = (_, storage) => {
    return (
      <span>
        <a
          onClick={() => this.syncTo(this.props.node, storage)}
        >Sync to</a>
        <Divider type="vertical"/>

        <a
          onClick={() => this.syncFrom(this.props.node, storage)}
        >Sync from</a>
        <Divider type="vertical"/>

        <a
          onClick={() => this.detachStorage(this.props.node, storage)}
        >Detach</a>
      </span>
    );
  }

  onAttachStorage = () => {
    this.setState({attachStorageModalVisible: true});
  }

  attachStorage = async () => {
    const data = {
      path: this.props.node.path,
      storage_id: this.state.attachStorageId,
    };
    console.log('attachStorage', data);
  }

  syncTo = async (node, storage) => {
    const data = await api.post('/api/sync-to-storage', {
        path: node.path,
        storage_id: storage.id,
    });
    notification.success({
      message: `Syncing to ${storage.name}`,
      // TODO
    });
  }

  syncFrom = async (node, storage) => {
    const data = await api.post('/api/sync-from-storage', {
        path: node.path,
        storage_id: storage.id,
    });
    notification.success({
      message: `Syncing from ${storage.name}`,
      // TODO
    });
  }

  detachStorage = async (node, storage) => {
    // TODO
  }

  _attachStorageId() {
    return this.state.attachStorageId || (this.props.availStorages[0] || {}).id;
  }
}
