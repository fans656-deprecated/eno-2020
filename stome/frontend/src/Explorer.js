import React from 'react';
import _ from 'lodash';
import { Modal, Upload, Button, Input, Tree, Popconfirm, message } from 'antd';
import NodePanel from './NodePanel';
import getTransferManager from './transfermanager';

const currentPath = process.browser ? window.location.pathname : '/';

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPath: currentPath,
      inputPath: currentPath,
      nodes: [],
      selectedNodes: [],
      renameModalVisible: false,
      renameNodeName: '',
    };
    this.fileInput = React.createRef();
  }

  componentDidMount = async () => {
    await this.changeCurrentPath(this.state.currentPath);
  }

  render() {
    return (
      <div className="horz" style={{minHeight: '100%'}}>
        <div className="vert stretch" style={{flex: 1}}>
          <Input.Group className="horz">
            <Button title="Current directory" onClick={this.onCurrentDirectory}>.</Button>
            <Button title="Parent directory"
              disabled={this.state.currentPath === '/'}
              onClick={this.onParentDirectory}>..</Button>
            <Input
              className="mono"
              value={this.state.inputPath}
              onChange={ev => this.setState({inputPath: ev.target.value})}
              onPressEnter={this.onChangePath}
              style={{flex: 1}}
            />
            <Popconfirm
              title="Are you sure to delete?"
              onConfirm={this.onDelete}
              okText="Delete"
            >
              <Button icon="delete" title="Delete" disabled={!this.selected()}/>
            </Popconfirm>
            <Button icon="swap" title="Move (edit path as target)"
              disabled={!this.selected() || this.state.inputPath === this.state.currentPath}
              onClick={this.onMove}
            />
            <Button icon="folder-add" title="New directory (edit path as target)"
              disabled={this.state.inputPath === this.state.currentPath}
              onClick={this.onNewDirectory}
            />
            <Button icon="edit" title="Rename" disabled={!this.singleSelected()}
              onClick={() => this.setState({
                renameModalVisible: true,
                renameNodeName: this.state.selectedNodes[0].name,
              })}
            />
            {false &&
            <Upload
              showUploadList={false}
              multiple={true}
              beforeUpload={this.onUploadFile}
            >
              <Button icon="upload" title="Upload"/>
            </Upload>
            }
            <Button icon="upload" title="Upload"
              onClick={() => this.fileInput.current.click()}
            />
            <input ref={this.fileInput}
              type="file"
              style={{display: 'none'}}
              multiple
              onChange={ev => {
                getTransferManager().uploadFiles(this.state.currentPath, ev.target.files);
              }}
            />
          </Input.Group>
          <Tree.DirectoryTree
            key={this.state.currentPath}
            className="explorer-tree"
            multiple
            blockNode={true}
            expandAction="doubleClick"
            dataSource={this.state.nodes}
            onSelect={this.onSelect}
            onExpand={this.onExpand}
          >
            {this.renderItems(this.state.nodes)}
          </Tree.DirectoryTree>
        </div>
        <div style={{flex: 1}}>
          {this.state.selectedNodes.length === 1 &&
            <NodePanel
              key={this.state.selectedNodes[0].path}
              node={this.state.selectedNodes[0]}
              availStorages={this.props.storages}
            />
          }
        </div>
        <Modal
          title="Rename"
          visible={this.state.renameModalVisible}
          onOk={this.doRename}
          onCancel={() => this.setState({renameModalVisible: false})}
        >
          <Input
            value={this.state.renameNodeName}
            onChange={ev => this.setState({renameNodeName: ev.target.value})}
            onPressEnter={ev => {
              this.doRename();
              ev.preventDefault();
            }}
          />
        </Modal>
      </div>
    );
  }

  renderItems = (nodes) => {
    return nodes.map(node => {
      return (
        <Tree.TreeNode
          title={node.name}
          key={node.path}
          isLeaf={node.type !== 'dir'}
        >
        </Tree.TreeNode>
      );
    });
  }

  onSelect = (paths) => {
    const nodes = paths.map(path => this.pathToNode[path])
    this.setState({selectedNodes: nodes});
  }

  onExpand = (paths) => {
    this.changeCurrentPath(paths[0]);
  }

  onCurrentDirectory = () => {
    this.setState({
      inputPath: this.state.currentPath,
    });
  }

  onParentDirectory = () => {
    let path = this.state.currentPath;
    const parts = path.split('/');
    parts.pop();
    path = parts.join('/');
    this.changeCurrentPath(path);
  }

  onChangePath = () => {
    this.changeCurrentPath(this.state.inputPath);
  }

  onDelete = () => {
    this.deleteNodes(this.state.selectedNodes);
  }

  onMove = async () => {
  }

  onNewDirectory = async () => {
    const res = await fetch(`/api/dir/${normalized(this.state.inputPath)}`, {
      method: 'POST',
    });
    if (res.status === 200) {
      this.changeCurrentPath(this.state.currentPath, true);
    } else {
      message.error(`Failed to create (${res.status})`);
    }
  }

  onUploadFile = (file) => {
    //let path = normalized(this.state.currentPath);
    //if (path.length) {
    //  path = `/${path}/${file.name}`;
    //} else {
    //  path = `/${file.name}`;
    //}
    //getTransferManager().upload(path, file);
    return false;
  }

  deleteNodes = async (nodes) => {
    const res = await fetch('/api/rm', {
      method: 'POST',
      body: JSON.stringify({
        paths: nodes.map(node => node.path),
      }),
    });
    if (res.status === 200) {
    } else {
      message.error(`Failed to delete (${res.status})`);
    }
    this.changeCurrentPath(this.state.currentPath, true);
  }

  doRename = () => {
    const node = this.state.selectedNodes[0];
    const newName = this.state.renameNodeName;
    if (newName.length === 0) {
      message.error('Empty name');
      return;
    }
    if (node.name !== newName) {
      const newPath = renamed(node.path, newName);
      console.log(node.path, newPath);
    }
    this.setState({renameModalVisible: false});
  }

  changeCurrentPath = async (path) => {
    const samePath = path === this.state.currentPath;
    path = normalized(path);
    const res = await fetch(`/api/dir/${path}`);
    if (res.status === 200) {
      const data = await res.json();
      const nodes = data.children || [];
      this.pathToNode = {};
      for (const node of nodes) {
        const prefix = path.length ? `/${path}` : '';
        node.path = `${prefix}/${node.name}`;
        this.pathToNode[node.path] = node;
      }
      nodes.sort((a, b) => {
        if (a.type === b.type) {
          return a.name <= b.name ? -1 : 1;
        } else {
          return a.type === 'dir' ? -1 : 1;
        }
      });
      this.setState({
        currentPath: '/' + path,
        inputPath: '/' + path,
        nodes: nodes,
        selectedNodes: samePath ? this.state.selectedNodes : [],
      });
    } else {
      message.error('Failed to load path');
    }
  }

  selected = () => {
    return this.state.selectedNodes.length > 0;
  }

  singleSelected = () => {
    return this.state.selectedNodes.length === 1;
  }
}

function normalized(path) {
  if (path == null) {
    path = '/';
  }
  if (path.startsWith('/')) {
    path = path.substring(1);
  }
  if (path.endsWith('/')) {
    path = path.substring(0, path.length - 1);
  }
  return path;
}

function renamed(path, name) {
  const parts = path.split('/');
  parts.pop();
  return [...parts, name].join('/');
}
