import uuidv4 from 'uuid/v4';

import { noop } from './utils';

export default function getTransferManager() {
  return transferManager;
}

class TransferManager {
  constructor() {
    this.listeners = [];
    this.transfers = [];
    this.idToTransfer = {};
    this.notifyTimerId = null;
    this.notifyDelayCount = 0;
    this.onUploadFinished = noop;
    if (process.browser) {
      const eventSource = new EventSource('/api/transfer-event-source');
      eventSource.addEventListener('progress', (ev) => {
        const data = JSON.parse(ev.data);
        this.onProgress(data);
      });
    }
  }

  uploadFiles = (dirPath, files) => {
    if (dirPath.startsWith('/')) {
      dirPath = dirPath.substring(1);
    }
    for (const file of files) {
      let path = dirPath + '/' + file.name;
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
      const transfer = new UploadTransfer(this, path, file);
      this.addTransfer(transfer, false);
    }
    this.startTransfer();
    this.notify();
  }

  upload = (path, file) => {
    const transfer = new UploadTransfer(this, path, file);
    this.addTransfer(transfer);
    this.startTransfer();
  }

  startTransfer = () => {
    const activeTransfers = this.transfers.filter(t => t.status === 'active');
    if (activeTransfers.length) {
      console.log('hasActive');
      return;
    }
    for (const transfer of this.transfers) {
      if (transfer.status == 'ready') {
        transfer.start();
        break;
      }
    }
  }

  addListener = (eventName, callback) => {
    this.listeners.push(callback);
  }

  addTransfer = (transfer, notify) => {
    this.transfers.push(transfer);
    this.idToTransfer[transfer.id] = transfer;
    if (notify !== false) {
      this.notify();
    }
  }

  onProgress = (data) => {
    const transfer = this.idToTransfer[data.id];
    if (transfer && !transfer.settled) {
      transfer.progress = data.progress != null
        ? data.progress
        : data.n_bytes_received / data.n_bytes_total;
      this.notify();
    }
  }

  clearTransfer = (transfer) => {
    this.transfers = this.transfers.filter(t => t.id != transfer.id);
    this.idToTransfer = _.keyBy(this.transfers, t => t.id);
    this.notify();
  }

  clearSettledTransfers = () => {
    this.transfers = this.transfers.filter(t => !t.settled);
    this.idToTransfer = _.keyBy(this.transfers, t => t.id);
    this.notify();
  }

  notify = () => {
    if (this.notifyDelayCount > 5) {
      this.notifyDelayCount = 0;
      this._instantNotify();
    } else {
      this._delayedNotify();
    }
  }

  _instantNotify = () => {
    if (this.notifyTimerId) {
      clearTimeout(this.notifyTimerId);
    }
    this._notify();
  }

  _delayedNotify = () => {
    if (this.notifyTimerId) {
      clearTimeout(this.notifyTimerId);
    }
    this.notifyTimerId = setTimeout(this._notify, 100);
    ++this.notifyDelayCount;
  }

  _notify = () => {
    for (const listener of this.listeners) {
      listener(null, this);
    }
  }
}

class UploadTransfer {
  constructor(manager, path, file) {
    this.manager = manager;
    this.type = 'upload';
    this.status = 'ready';
    this.id = this.key = uuidv4();
    this.name = path.split('/').pop();
    this.path = path;
    this.file = file;
    this.progress = 0.0;
    this.abortController = null;
  }

  start = async () => {
    if (!this.abortController) {
      this.status = 'active';
      this.abortController = new AbortController();
      const url = `/api/file/${this.path}?force=1&transfer=${this.id}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': this.file.type},
        body: this.file,
        signal: this.abortController.signal,
      });
      if (res.status === 200) {
        this.settle('finished');
      } else {
        this.settle('error');
        console.log('Transfer error', res.status, this, await res.text());
      }
      this.manager.notify();
    }
  }

  abort = () => {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this.settle('canceled');
      this.manager.notify();
    }
  }

  settle = (status) => {
    this.status = status;
    this.settled = true;
    if (status === 'finished') {
      this.manager.clearTransfer(this);
      this.manager.onUploadFinished(this);
    }
    this.manager.startTransfer();
  }
}

class SyncToTransfer {
  constructor(path) {
    this.type = 'sync-to';
    this.id = uuidv4();
    this.name = path.split('/').pop();
    this.path = path;
    this.progress = 0.0;
  }
}

const transferManager = new TransferManager();
