import _ from 'lodash';
import Path from 'path';

import { api, error, noop } from './utils';

export default class FileSystem {
  constructor(path, options) {
    this.currentDir = new Dir(path);
    this.onRefresh = options.onRefresh || noop;
  }

  cd = async (path) => {
    const dir = new Dir(path);
    this.currentDir = dir;
    await this.refresh();
  }

  cdUp = async () => {
    if (this.currentDir.path !== '/') {
      await this.cd(Path.dirname(this.currentDir.path));
    }
  }

  mkdir = async (path) => {
    const dir = new Dir(path);
    await api.post(`/api/dir${dir.path}`);
    await this.refresh();
  }

  rename = async (oldPath, newName) => {
    const newPath = Path.join(Path.dirname(oldPath), newName);
    this._mv({src_paths: [[oldPath, newPath]]});
  }

  mv = (paths, dirPath) => {
    this._mv({src_paths: paths, dst_path: dirPath});
  }

  _mv = async (data) => {
    const {errors} = await api.post('/api/mv', data);
    if (errors.length) {
      error('Move error', JSON.stringify(errors, null, 2));
    }
    await this.refresh();
  }

  rm = async (paths) => {
    await api.post('/api/rm', {paths: paths});
    await this.refresh();
  }

  refresh = async () => {
    await this.currentDir.list();
    this.onRefresh(this.currentDir);
  }

  get currentPath() {
    return this.currentDir.path;
  }
}

class Dir {
  constructor(path) {
    this.path = normalize(path);
    this.nodes = [];
    this.pathToNode = {};
  }

  list = async () => {
    const {dirs, files} = await api.get(`/api/dir${this.path}`);
    this.nodes = [...dirs, ...files].map(node => new Node(this.path, node));
    this.pathToNode = _.keyBy(this.nodes, node => node.path);
  }

  getNodeByPath = (path) => {
    return this.pathToNode[path];
  }
}

class Node {
  constructor(dirPath, node) {
    Object.assign(this, node);
    this.path = Path.join(dirPath, node.name);
  }
}

function normalize(path) {
  if (!path || !path.length) {
    path = '/';
  }
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  if (path.length > 1 && path.endsWith('/')) {
    path = path.substring(0, path.length - 1);
  }
  return path;
}
