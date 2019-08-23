import os
import json
import uuid
import hashlib
from enum import Enum

import aiofiles

import conf
from utils import cached, meta_path, inode_path


CHUNK_SIZE = 4096
META_DIR_PREFIX_LENGTH = len(os.path.abspath(conf.META_DIR))


class NodeType(Enum):

    Dir = 'dir'
    File = 'file'


class Node:

    def __init__(self, path):
        self._abspath = absolute_path(path)
        self.path = external_path(self._abspath)

    @property
    def existed(self):
        return os.path.exists(self._abspath)

    @property
    @cached
    def type(self):
        if os.path.isdir(self._abspath):
            return NodeType.Dir
        else:
            return NodeType.File

    @property
    def meta(self):
        pass

    @property
    def private(self):
        return False

    def delete(self):
        if self.type == NodeType.Dir:
            return Dir(self.path).delete()
        else:
            return File(self.path).delete()

    def __bool__(self):
        return self.existed


class Dir(Node):

    def create(self, request=None):
        os.makedirs(self._abspath)

    def delete(self):
        pass

    def list(self):
        pass


class File(Node):

    @property
    def meta(self):
        ret = super().meta
        try:
            with open(self._abspath) as f:
                meta = json.load(f)
            ret.update(meta)
        except Exception:
            pass
        return ret

    @property
    def mime(self):
        return self.meta.get('mime', 'application/octet-stream')

    @property
    def inode(self):
        return Inode(self.meta['inode'])

    @property
    def content(self):
        return self.inode.content

    async def create(self, request, force=False):
        self._ensure_parent_dir()
        if self.existed:
            inode = self.meta['inode']
            os.remove(inode_path(inode))
        tmp_fname = str(uuid.uuid4())
        tmp_fpath = inode_path(tmp_fname)
        try:
            hasher = hashlib.md5()
            async with aiofiles.open(tmp_fpath, 'wb') as f:
                async for chunk in request.stream():
                    await f.write(chunk)
                    hasher.update(chunk)
            inode = hasher.hexdigest()
            os.rename(tmp_fpath, inode_path(inode))

            # TODO: mime type
            self.meta['inode'] = inode
            self.save_meta()
        finally:
            if os.path.exists(tmp_fpath):
                os.remove(tmp_fpath)

    def delete(self):
        if self.existed:
            inode = self.meta['inode']
            os.path.remove(inode_path(inode))
            os.path.remove(meta_path(self.path))

    def save_meta(self):
        with open(meta_path(self.path), 'w') as f:
            json.dump(self.meta, f, indent=2, sort_keys=True)

    def _ensure_parent_dir(self):
        d = Dir(os.path.dirname(self.path))
        if not d.existed:
            d.create()


class Inode:

    def __init__(self, md5):
        self.md5 = md5
        self._data_fpath = os.path.join(conf.INODE_DIR, md5)
        self._meta_fpath = os.path.join(conf.INODE_META_DIR, md5)

    @property
    def content(self):
        with open(self._data_fpath, 'rb') as f:
            return f.read()


def absolute_path(path):
    if path.startswith('/'):
        path = path[1:]
    path = os.path.join(conf.META_DIR, path)
    path = os.path.abspath(path)
    if not path.startswith(conf.META_DIR):
        raise RuntimeError('invalid path')
    return path


def external_path(abspath):
    path = abspath[META_DIR_PREFIX_LENGTH:]
    return path or '/'
