import os


DEBUG = os.environ.get('DEBUG')


ROOT_DIR = os.path.abspath(os.environ.get('ROOT', '/data/stome-root'))
META_DIR = os.path.join(ROOT_DIR, 'meta')
TEMP_DIR = os.path.join(ROOT_DIR, 'temp')
INODE_DATA_DIR = os.path.join(ROOT_DIR, 'inode-data')
INODE_META_DIR = os.path.join(ROOT_DIR, 'inode-meta')

META_DIR_PREFIX_LENGTH = len(META_DIR)
CHUNK_SIZE = 4096

with open('/data/enozone.pub') as f:
    PUBKEY = f.read().strip()

for path in (META_DIR, TEMP_DIR, INODE_DATA_DIR, INODE_META_DIR):
    if not os.path.exists(path):
        os.makedirs(path)
