import uuidv4 from 'uuid/v4';
import Path from 'path';
import { notification } from 'antd';

import { noop } from './utils';

export default class Uploader {
  constructor() {
    this._uploads = [];
    this._idToUpload = {};
    this._onScheduled = noop;
    this._onProgress = this._defaultOnProgress;
    this._onFinished = noop;
    this._onAborted = noop;
    this._onError = noop;

    this._connectTransferSource();
  }

  upload = (dirPath, files) => {
    const uploads = Array.from(files).map(file => this._createUpload(dirPath, file));
    this._addUploads(uploads);
    this._onScheduled(uploads, this);
    this._startNextUpload();
    return uploads;
  }

  /**
   * Add listener when new uploads are scheduled.
   * @param {(addedUploads, uploader) => ...} callback
   */
  onScheduled = (callback) => {
    this._onScheduled = callback;
  }

  onProgress = (callback) => {
    this._onProgress = callback;
  }

  onFinished = (callback) => {
    this._onFinished = callback;
  }

  onError = (callback) => {
    this._onError = callback;
  }

  get uploads() {
    return this._uploads;
  }

  clear = (uploads) => {
  }

  _createUpload = (dirPath, file) => {
    const id = uuidv4();
    const path = Path.join(dirPath, file.name);
    return new Upload(this, id, path, file);
  }

  _addUploads = (uploads) => {
    for (const upload of uploads) {
      this._uploads.push(upload);
      this._idToUpload[upload.id] = upload;
    }
  }

  _connectTransferSource = () => {
    if (!process.browser) return;
    const eventSource = new EventSource('/api/stream/transfer');
    eventSource.addEventListener('progress', (ev) => {
      const data = JSON.parse(ev.data);
      this._onProgress(data);
    });
  }

  _defaultOnProgress = (data) => {
    console.log(data);
  }

  _startNextUpload = () => {
    for (const upload of this._uploads) {
      if (upload.status === 'ready') {
        upload.start();
        break;
      }
    }
  }
}

class Upload {
  constructor(uploader, id, path, file) {
    this.uploader = uploader;
    this.id = id;
    this.path = path;
    this.file = file;
    this.name = Path.basename(path);
    this.progress = 0.0;
    this.status = 'ready';
  }

  start = async () => {
    const url = `/api/file/${this.path}?force=1&transfer=${this.id}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': this.file.type},
      body: this.file,
    });
    if (res.status === 200) {
      this.progress = 1.0;
      this._settle('finished');
    } else {
      this._settle('error', res);
      console.log('Transfer error', res.status, this, await res.text());
    }
  }

  _settle = (status) => {
    this.status = status;
    this.uploader._startNextUpload();
  }
}
