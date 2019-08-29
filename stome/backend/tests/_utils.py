import os
import json
import shutil
import pathlib
import hashlib

import pytest


os.environ['ROOT'] = os.path.abspath('test-root')
import conf

EXISTED_DIR = 'existed-dir'
EXISTED_FILE = os.path.join(EXISTED_DIR, 'existed-file')
NOT_EXISTED_DIR = 'not-existed-dir'
NOT_EXISTED_FILE = os.path.join(EXISTED_DIR, 'not-existed-file')

EXISTED_FILE_CONTENT = 'EXISTED_FILE_CONTENT'.encode()
NEW_CONTENT = 'NEW_CONTENT'.encode()


@pytest.fixture
def filesystem():
    if os.path.exists(conf.ROOT_DIR):
        shutil.rmtree(conf.ROOT_DIR)
    os.makedirs(conf.ROOT_DIR)
    os.makedirs(conf.META_DIR)
    os.makedirs(conf.TEMP_DIR)
    os.makedirs(conf.INODE_DATA_DIR)
    os.makedirs(conf.INODE_META_DIR)

    os.makedirs(meta_path(EXISTED_DIR))
    create_file(EXISTED_FILE, EXISTED_FILE_CONTENT)

    yield
    #shutil.rmtree(conf.ROOT_DIR)


def create_file(path, content):
    inode = md5(content)
    meta = {'inode': inode}
    with open(meta_path(EXISTED_FILE), 'w') as f:
        json.dump(meta, f, indent=2, sort_keys=True)
    with open(inode_path(inode), 'wb') as f:
        f.write(content)


def md5(content):
    h = hashlib.md5()
    h.update(content)
    return h.hexdigest()


def meta_path(path):
    return os.path.join(conf.META_DIR, path)


def inode_path(path):
    return os.path.join(conf.INODE_DATA_DIR, path)


async def gen_content(content):
    yield content


async def get_content(stream):
    content = b''
    async for chunk in stream:
        content += chunk
    return content
