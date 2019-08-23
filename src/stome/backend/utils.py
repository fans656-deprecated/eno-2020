import os
import functools

import conf


def get_user(request):
    token = request.cookies.get('token')
    if token:
        try:
            return jwt.decode(token, conf.PUBKEY, algorithm='RS512')
        except Exception:
            pass
    return {'username': ''}


def cached(func):
    @functools.wraps(func)
    def wrapped(self, *args, **kwargs):
        attrname = '_' + func.__name__
        if not hasattr(self, attrname):
            setattr(self, attrname, func(self, *args, **kwargs))
        return getattr(self, attrname)
    return wrapped


def meta_path(path):
    if path.startswith('/'):
        path = path[1:]
    return os.path.join(conf.META_DIR, path)


def inode_path(path):
    if path.startswith('/'):
        path = path[1:]
    return os.path.join(conf.INODE_DIR, path)
