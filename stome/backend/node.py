import os
import json
import mimetypes
from enum import Enum

import conf
from inode import Inode


class NodeType(Enum):

    Dir = 'dir'
    File = 'file'


class Node:

    def __init__(self, path):
        self._abspath = _absolute_path(path)
        self.path = self._abspath[conf.META_DIR_PREFIX_LENGTH:]
        self.fname = os.path.basename(self.path)

    @property
    def meta(self):
        try:
            with open(self._abspath) as f:
                meta = json.load(f)
        except Exception:
            meta = {}
        return meta

    @property
    def type(self):
        return NodeType.Dir if os.path.isdir(self._abspath) else NodeType.File

    def move(self, dst):
        dir_path = os.path.dirname(dst.path)
        dst_dir = Dir(dir_path)
        if not dst_dir:
            dst_dir.create()
        os.replace(self._abspath, dst._abspath)

    def delete(self):
        if self.type == NodeType.Dir:
            Dir(self.path).delete()
        else:
            File(self.path).delete()

    def save_meta(self, meta=None):
        with open(self._abspath, 'w') as f:
            json.dump(meta or self.meta, f, indent=2, sort_keys=True)

    def __bool__(self):
        return os.path.exists(self._abspath)

    def __repr__(self):
        return f'{self.__class__.__name__}(path={self.path})'

    def __iter__(self):
        return iter([
            ('type', self.type.value),
            ('path', self.path),
            ('name', self.fname),
        ])


class Dir(Node):

    def create(self, request=None):
        os.makedirs(self._abspath)

    def delete(self):
        for node in self.nodes:
            node.delete()
        os.rmdir(self._abspath)

    def list(self):
        dirs = []
        files = []
        for node in self.nodes:
            if node.type == NodeType.Dir:
                dirs.append(node)
            else:
                files.append(node)
        dirs.sort(key=lambda d: d.fname)
        files.sort(key=lambda f: f.fname)
        return dirs, files

    @property
    def nodes(self):
        return [Node(os.path.join(self.path, fname)) for fname in os.listdir(self._abspath)]



class File(Node):

    @property
    def inode(self):
        inode_id = self.meta.get('inode')
        return Inode(inode_id) if inode_id else None

    async def create(self, stream, transfer=None):
        # ensure parent directory exists
        d = Dir(os.path.dirname(self.path))
        if not d:
            d.create()
        # ensure old inode removed
        inode = self.inode
        if inode:
            inode.unref()
        # create new inode
        inode = await Inode.create(stream, _get_mime(self.fname), transfer=transfer)
        # init meta
        self.save_meta({
            'inode': inode.md5,
        })

    def delete(self):
        self.inode.unref()
        if os.path.exists(self._abspath):
            os.remove(self._abspath)


def _absolute_path(path):
    if path.startswith('/'):
        path = path[1:]
    path = os.path.abspath(os.path.join(conf.META_DIR, path))
    if not path.startswith(conf.META_DIR):
        raise RuntimeError(f'invalid path {path}')
    return path


def _get_mime(fname):
    mime, encoding = mimetypes.guess_type(fname)
    return mime or 'application/octet-stream'
