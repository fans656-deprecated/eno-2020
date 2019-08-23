import os

import conf


META_DIR_PREFIX_LENGTH = len(os.path.abspath(conf.META_DIR))


class Node:

    def __init__(self, path):
        self._abspath = absolute_path(path)
        self.path = external_path(self._abspath)

    def __bool__(self):
        if not hasattr(self, 'existed'):
            self.existed = os.path.exists(self._abspath)
        return self.existed

    def is_private(self):
        return False

    def delete(self):
        pass

    @property
    def type(self):
        if not hasattr(self, '_type'):
            if os.path.isdir(self._abspath):
                self._type = 'dir'
            else:
                self._type = 'file'
        return self._type

    @property
    def meta(self):
        return {
            'path': self.path,
            'type': self.type,
        }


class Dir(Node):

    def create(self, request):
        pass

    def delete(self):
        pass

    def list(self):
        pass


class File(Node):

    async def create(self, request):
        pass

    def delete(self):
        pass


def absolute_path(path):
    path = os.path.join(conf.META_DIR, path)
    path = os.path.abspath(path)
    if not path.startswith(conf.META_DIR):
        raise RuntimeError('invalid path')
    return path


def external_path(abspath):
    path = abspath[META_DIR_PREFIX_LENGTH:]
    return path or '/'
