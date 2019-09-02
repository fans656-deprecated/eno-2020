import React from 'react';
import _ from 'lodash';
import Path from 'path';
import { Modal, Upload, Button, Input, Tree, Popconfirm, message } from 'antd';

import NodePanel from './NodePanel';
import FileSystem from './filesystem';
import getTransferManager from './transfermanager';
import { api } from './utils';

const URL_PATH = process.browser ? window.location.pathname : '/';

export default class Explorer extends React.Component {
  constructor(props) {
    super(props);
    this.filesystem = new FileSystem(URL_PATH, {onRefresh: this.onRefresh});
    this.state = {
      currentPath: this.filesystem.currentPath,
      nodes: [],
      selectedPaths: [],
      renameModalVisible: false,
      renameModalNewName: '',
    };
    this.fileInput = React.createRef();
    getTransferManager().onUploadFinished = this.onUploadFinished;
  }

  componentDidMount = () => {
    this.filesystem.cd(this.state.currentPath);
  }

  render() {
    const selectedPath = this.state.selectedPaths[0];
    const selectedNode = this.filesystem.currentDir.getNodeByPath(selectedPath);
    return (
      <div className="horz" style={{minHeight: '100%'}}>
        <div className="vert stretch" style={{flex: 1}}>
          {this.renderNav()}
          {this.renderTree()}
        </div>
        <div style={{flex: 1}}>
          {this.singleSelected() &&
            <NodePanel
              key={selectedNode.path}
              node={selectedNode}
              availStorages={this.props.storages}
            />
          }
        </div>
        {this.renderRenameModal()}
      </div>
    );
  }

  renderNav = () => {
    return (
      <Input.Group className="horz">
        <Button title="Current directory" onClick={this.onCurrentDirectory}>.</Button>
        <Button title="Parent directory" onClick={this.filesystem.cdUp}>.. </Button>
        <Input className="mono"
          value={this.state.currentPath}
          onChange={ev => this.setState({currentPath: ev.target.value})}
          onPressEnter={() => this.filesystem.cd(this.state.currentPath)}
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
          disabled={!this.selected() || this.state.currentPath === this.filesystem.currentPath}
          onClick={this.onMove}
        />
        <Button icon="folder-add" title="New directory (edit path as target)"
          disabled={this.state.currentPath === this.filesystem.currentPath}
          onClick={this.onNewDirectory}
        />
        <Button icon="edit" title="Rename" disabled={!this.singleSelected()}
          onClick={() => this.setState({
            renameModalVisible: true,
            renameModalNewName: Path.basename(this.state.selectedPaths[0]),
          })}
        />
        <Button icon="upload" title="Upload"
          onClick={() => this.fileInput.current.click()}
        />
        <input ref={this.fileInput}
          type="file"
          style={{display: 'none'}}
          multiple
          onChange={ev => {
            getTransferManager().uploadFiles(this.state.currentPath, ev.target.files);
            this.fileInput.current.value = null;
          }}
        />
      </Input.Group>
    );
  }

  renderTree = () => {
    const nodes = this.state.nodes;
    const nodeComps = nodes.map(node => (
      <Tree.TreeNode
        title={node.name}
        key={node.path}
        isLeaf={node.type !== 'dir'}
      >
      </Tree.TreeNode>
    ));
    return (
      <Tree.DirectoryTree
        key={this.state.currentPath}
        multiple
        blockNode={true}
        expandAction="doubleClick"
        dataSource={this.state.nodes}
        selectedKeys={this.state.selectedPaths}
        onSelect={this.onSelect}
        onExpand={this.onExpand}
      >
        {nodeComps}
      </Tree.DirectoryTree>
    );
  }

  renderRenameModal = () => {
    return (
      <Modal
        title="Rename"
        visible={this.state.renameModalVisible}
        onOk={this.onRename}
        onCancel={() => this.setState({renameModalVisible: false})}
      >
        <Input
          value={this.state.renameModalNewName}
          onChange={ev => this.setState({renameModalNewName: ev.target.value})}
          onPressEnter={ev => {
            this.onRename();
            ev.preventDefault();
          }}
        />
      </Modal>
    );
  }

  onSelect = (paths) => {
    this.setState({selectedPaths: paths});
  }

  onExpand = (paths) => {
    this.setState({
      selectedPaths: [],
    }, () => {
      this.filesystem.cd(paths[0]);
    });
  }

  onCurrentDirectory = () => {
    this.setState({currentPath: this.filesystem.currentPath});
  }

  onDelete = () => {
    const paths = this.state.selectedPaths;
    this.setState({
      selectedPaths: [],
    }, () => this.filesystem.rm(paths));
  }

  onMove = () => {
    const paths = this.state.selectedPaths;
    this.setState({
      selectedPaths: [],
    }, () => this.filesystem.mv(paths, this.state.currentPath));
  }

  onRename = () => {
    const node = this.selectedNode();
    const newName = this.state.renameModalNewName;
    if (newName.length === 0) {
      message.error('Empty name');
      return;
    }
    if (node.name !== newName) {
      this.setState({
        selectedPaths: [],
      }, () => this.filesystem.rename(node.path, newName));
    }
    this.setState({renameModalVisible: false});
  }

  onNewDirectory = async () => {
    this.filesystem.mkdir(this.state.currentPath);
  }

  changeDirectory = async (path) => {
    const samePath = path === this.state.currentPath;
    this.filesystem.cd(path);
    const dir = new Dir(path);
    const { nodes, pathToNode } = await dir.list();
    this.pathToNode = pathToNode;
    this.setState({
      currentPath: path,
      nodes: nodes,
      selectedPaths: samePath ? this.state.selectedPaths : [],
    });
  }

  selected = () => {
    return this.state.selectedPaths.length > 0;
  }

  singleSelected = () => {
    return this.state.selectedPaths.length === 1;
  }

  selectedNode = () => {
    const path = this.state.selectedPaths[0];
    const node = this.filesystem.currentDir.getNodeByPath(path);
    return node;
  }

  onRefresh = (currentDir) => {
    const nodes = currentDir.nodes.map(node => ({...node, key: node.path}));
    this.setState({
      currentPath: currentDir.path,
      nodes: nodes,
      selectedPaths: [],
    });
  }

  onUploadFinished = (transfer) => {
    // TODO: this is not extensible
    this.setState({
      nodes: [...this.state.nodes, {
        key: transfer.path,
        path: transfer.path,
        name: transfer.name,
        type: 'file',
      }],
    });
  }
}

function renamed(path, name) {
  const parts = path.split('/');
  parts.pop();
  return [...parts, name].join('/');
}
