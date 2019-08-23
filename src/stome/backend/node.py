import os
from enum import Enum

import conf
from inode import Inode, create_inode
from utils import cached


class NodeType(Enum):

    Dir = 'dir'
    File = 'file'


class Node:

    def __init__(self, path):
        self._abspath = _absolute_path(path)
        self.path = path[conf.META_DIR_PREFIX_LENGTH:]
        self.fname = os.path.basename(self.path)

    @property
    @cached
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


def _absolute_path(path):
    path = os.path.abspath(os.path.join(conf.META_DIR, path))
    if not path.startswith(conf.META_DIR):
        raise RuntimeError(f'invalid path {path}')
    return path



class Dir(Node):

    def create(self, request=None):
        os.makedirs(self._abspath)

    def delete(self):
        for node in self.children:
            node.delete()
        os.rmdir(self._abspath)

    def list(self):
        return [{
            'name': node.fname,
            'type': node.type,
        } for node in self.children]

    @property
    def children(self):
        return [Node(os.path.join(self.path, fname)) for fname in os.listdir(self._abspath)]



class File(Node):

    @property
    def inode(self):
        return Inode(self.meta.get('inode'))

    async def create(self, stream):
        # ensure parent directory exists
        d = Dir(os.path.dirname(self.path))
        if not d.existed:
            d.create()
        # ensure old inode removed
        inode = self.inode
        if inode:
            inode.unref()
        # create new inode
        inode = await create_inode(stream, _get_mime(self.fname))
        # init meta
        self.save_meta({
            'inode': inode.id,
        })

    def delete(self):
        self.inode.unref()
        if os.path.exists(self._abspath):
            os.path.remove(self._abspath)


def _get_mime(fname):
    main, sub = mimetypes.guess_type(self.fname)
    if main:
        return f'{main}/{sub}'
    return 'application/octet-stream'
