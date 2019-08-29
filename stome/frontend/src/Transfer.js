import React from 'react';
import { Icon, Radio, Modal, Card, Divider, Table, Button, Input, message } from 'antd';
import getTransferManager from './transfermanager';

export default class Transfer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      transfers: getTransferManager().transfers,
    };
    getTransferManager().addListener('changed', (ev, manager) => {
      this.setState({
        transfers: manager.transfers,
      });
    });
    this.transferColumns = this.getTransferColumns();
  }

  render() {
    return (
      <div>
        <Card
          extra={
            <div>
              <a></a>
              <Divider type="vertical"/>
              <a onClick={() => getTransferManager().clearSettledTransfers()}>Clear</a>
            </div>
          }
          size="small"
        >
          <Table
            size="small"
            pagination={false}
            columns={this.transferColumns}
            dataSource={this.state.transfers}
          />
        </Card>
      </div>
    );
  }

  getTransferColumns = () => {
    return [
      {
        title: 'Type',
        dataIndex: 'type',
        render: (type) => {
          switch (type) {
            case 'upload':
              return <Icon title="Upload" type="upload"/>;
            case 'sync-to':
              return <Icon type="cloud-upload"/>;
            case 'sync-from':
              return <Icon type="cloud-download"/>;
            default:
              return null;
          }
        },
      },
      {
        title: 'Name',
        dataIndex: 'name',
        render: (name, transfer) => {
          return <div title={transfer.path}>{name}</div>;
        },
      },
      {
        title: 'Progress',
        dataIndex: 'progress',
        render: (progress, transfer) => {
          let icon = null;
          switch (transfer.status) {
            case 'active':
              icon = <Icon type="loading"/>; break;
            case 'error':
              icon = <Icon type="close-circle" style={{color: 'red'}}/>; break;
            case 'canceled':
              icon = <Icon type="stop"/>; break;
            case 'finished':
              icon = <Icon type="check-circle" style={{color: 'green'}}/>; break;
            case 'ready':
            default:
              icon = <Icon type="ellipse"/>; break;
          }
          return (
            <div>
              <span
                style={{display: 'inline-block', width: '5em', textAlign: 'right'}}
              >{(progress * 100.0).toFixed(2)}%</span>
              {icon}
            </div>
          );
        }
      },
      {
        title: 'Actions',
        render: (_, transfer) => {
          if (transfer.settled) {
            return <a onClick={() => getTransferManager().clearTransfer(transfer)}>Clear</a>;
          } else {
            return <a onClick={transfer.abort}>Abort</a>;
          }
        },
      },
    ];
  }
}
