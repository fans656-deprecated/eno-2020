import os
import uuid
import hashlib

import conf
from utils import cached


async def create_inode(stream, mime):
    try:
        tmp_fpath, inode_id = await _write(stream)
        inode = Inode(inode_id, mime=mime)
        if not self.existed:
            os.rename(tmp_fpath, inode.data_fpath)
        inode.ref()
        return inode
    finally:
        if os.path.exists(tmp_fpath):
            os.remove(tmp_fpath)


async def _write(stream):
    fpath = os.path.join(conf.TEMP_DIR, str(uuid.uuid4()))
    hasher = hashlib.md5()
    async with aiofiles.open(fpath, 'wb') as f:
        async for chunk in stream:
            await f.write(chunk)
            hasher.update(chunk)
    return fpath, hasher.hexdigest()


class Inode:

    def __init__(self, inode_id, mime=None):
        self.id = inode_id
        self.mime = mime or 'application/octet-stream'
        self.data_fpath = os.path.join(conf.INODE_DIR, inode_id)
        self.meta_fpath = os.path.join(conf.INODE_META_DIR, inode_id)

    @property
    def mime(self):
        return self.meta['mime']

    @property
    @cached
    def meta(self):
        try:
            with open(self.meta_fpath) as f:
                return json.load(f)
        except Exception:
            return {'count': 0, 'mime': self.mime}

    @property
    def __bool__(self):
        return os.path.isfile(self.data_fpath)

    @property
    def content(self):
        with open(self.data_fpath, 'rb') as f:
            return f.read()

    def ref(self):
        self.meta['count'] += 1
        self.save_meta()

    def unref(self):
        self.meta['count'] -= 1
        if self.meta['count'] == 0:
            self.remove()
        else:
            self.save_meta()

    def remove(self):
        if os.path.exists(self.data_fpath):
            os.path.remove(self.data_fpath)
        if os.path.exists(self.meta_fpath):
            os.path.remove(self.meta_fpath)

    def save_meta(self):
        with open(self.meta_fpath, 'w') as f:
            json.dump(self.meta, f, indent=2, sort_keys=True)
